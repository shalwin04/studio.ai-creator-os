/**
 * Chat Routes
 *
 * Agent chat endpoints with SSE streaming and WebSocket support, backed by
 * real conversation/message persistence.
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { and, asc, desc, eq } from 'drizzle-orm';
import { AgentOrchestrator, type StreamEvent } from '../../services/agent/orchestrator.js';
import { getDb } from '../../lib/database.js';
import { conversations, messages } from '../../db/schema.js';

const chatMessageSchema = z.object({
  message: z.string().min(1).max(10000),
  conversationId: z.string().uuid().optional(),
});

const idParamsSchema = z.object({ id: z.string().uuid() });

async function ensureConversation(creatorId: string, conversationId: string | undefined, firstMessage: string) {
  const db = getDb();

  if (conversationId) {
    const existing = await db.query.conversations.findFirst({
      where: and(eq(conversations.id, conversationId), eq(conversations.creatorId, creatorId)),
    });
    if (existing) return existing;
  }

  const [conversation] = await db
    .insert(conversations)
    .values({
      creatorId,
      title: firstMessage.slice(0, 80),
    })
    .returning();

  if (!conversation) {
    throw new Error('Failed to create conversation');
  }

  return conversation;
}

async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  toolCalls?: unknown[],
  toolResults?: unknown[]
) {
  const db = getDb();
  await db.insert(messages).values({
    conversationId,
    role,
    content,
    toolCalls: toolCalls && toolCalls.length > 0 ? toolCalls : undefined,
    toolResults: toolResults && toolResults.length > 0 ? toolResults : undefined,
  });
  await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, conversationId));
}

export const chatRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/chat/stream - SSE streaming endpoint
  fastify.post('/stream', async (request, reply) => {
    const body = chatMessageSchema.parse(request.body);
    const creatorId = request.user!.creatorId;

    const conversation = await ensureConversation(creatorId, body.conversationId, body.message);

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    const toolCalls: unknown[] = [];
    const toolResults: unknown[] = [];
    let assistantText = '';

    try {
      const agent = new AgentOrchestrator({ creatorId, conversationId: conversation.id });

      for await (const event of agent.stream(body.message)) {
        if (event.type === 'tool_call') toolCalls.push({ tool: event.toolName, args: event.toolArgs });
        if (event.type === 'tool_result') toolResults.push({ tool: event.toolName, result: event.toolResult });
        if (event.type === 'text') assistantText += event.content ?? '';

        const outbound: StreamEvent = { ...event, conversationId: conversation.id };
        reply.raw.write(`data: ${JSON.stringify(outbound)}\n\n`);
      }

      await saveMessage(conversation.id, 'user', body.message);
      if (assistantText) {
        await saveMessage(conversation.id, 'assistant', assistantText, toolCalls, toolResults);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      reply.raw.write(`data: ${JSON.stringify({ type: 'error', error: message })}\n\n`);
    } finally {
      reply.raw.end();
    }
  });

  // GET /api/chat/ws - WebSocket endpoint
  fastify.get('/ws', { websocket: true }, (socket, request) => {
    const creatorId = request.user!.creatorId;

    socket.on('message', async (rawMessage: Buffer) => {
      try {
        const { message, conversationId } = chatMessageSchema.parse(JSON.parse(rawMessage.toString()));
        const conversation = await ensureConversation(creatorId, conversationId, message);

        const toolCalls: unknown[] = [];
        const toolResults: unknown[] = [];
        let assistantText = '';

        const agent = new AgentOrchestrator({ creatorId, conversationId: conversation.id });

        for await (const event of agent.stream(message)) {
          if (event.type === 'tool_call') toolCalls.push({ tool: event.toolName, args: event.toolArgs });
          if (event.type === 'tool_result') toolResults.push({ tool: event.toolName, result: event.toolResult });
          if (event.type === 'text') assistantText += event.content ?? '';

          socket.send(JSON.stringify({ ...event, conversationId: conversation.id }));
        }

        await saveMessage(conversation.id, 'user', message);
        if (assistantText) {
          await saveMessage(conversation.id, 'assistant', assistantText, toolCalls, toolResults);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        socket.send(JSON.stringify({ type: 'error', error: message }));
      }
    });
  });

  // GET /api/chat/conversations
  fastify.get('/conversations', async (request) => {
    const creatorId = request.user!.creatorId;
    const db = getDb();

    const results = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.creatorId, creatorId), eq(conversations.isArchived, false)))
      .orderBy(desc(conversations.updatedAt));

    return { conversations: results };
  });

  // GET /api/chat/conversations/:id
  fastify.get('/conversations/:id', async (request, reply) => {
    const creatorId = request.user!.creatorId;
    const { id } = idParamsSchema.parse(request.params);
    const db = getDb();

    const conversation = await db.query.conversations.findFirst({
      where: and(eq(conversations.id, id), eq(conversations.creatorId, creatorId)),
    });

    if (!conversation) {
      return reply.status(404).send({ error: 'NotFound', message: 'Conversation not found' });
    }

    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt));

    return { conversation: { ...conversation, messages: conversationMessages } };
  });

  // DELETE /api/chat/conversations/:id
  fastify.delete('/conversations/:id', async (request, reply) => {
    const creatorId = request.user!.creatorId;
    const { id } = idParamsSchema.parse(request.params);
    const db = getDb();

    const conversation = await db.query.conversations.findFirst({
      where: and(eq(conversations.id, id), eq(conversations.creatorId, creatorId)),
    });

    if (!conversation) {
      return reply.status(404).send({ error: 'NotFound', message: 'Conversation not found' });
    }

    await db.delete(messages).where(eq(messages.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));

    return { success: true };
  });
};
