/**
 * Chat Routes
 *
 * Agent chat endpoints with SSE streaming and WebSocket support.
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { AgentOrchestrator } from '../../services/agent/orchestrator.js';

const chatMessageSchema = z.object({
  message: z.string().min(1).max(10000),
  conversationId: z.string().uuid().optional(),
});

export const chatRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/chat/stream - SSE streaming endpoint
  fastify.post('/stream', async (request, reply) => {
    const body = chatMessageSchema.parse(request.body);
    const creatorId = request.user!.creatorId;

    // Set SSE headers
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    try {
      const agent = new AgentOrchestrator({
        creatorId,
        conversationId: body.conversationId,
      });

      for await (const event of agent.stream(body.message)) {
        reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
      }

      reply.raw.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
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

    socket.on('message', async (rawMessage) => {
      try {
        const { message, conversationId } = JSON.parse(rawMessage.toString());

        const agent = new AgentOrchestrator({ creatorId, conversationId });

        for await (const event of agent.stream(message)) {
          socket.send(JSON.stringify(event));
        }

        socket.send(JSON.stringify({ type: 'done' }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        socket.send(JSON.stringify({ type: 'error', error: message }));
      }
    });
  });

  // GET /api/chat/conversations
  fastify.get('/conversations', async (request, reply) => {
    // TODO: List conversations
    return { conversations: [] };
  });

  // GET /api/chat/conversations/:id
  fastify.get('/conversations/:id', async (request, reply) => {
    // TODO: Get conversation with messages
    return { conversation: null };
  });

  // DELETE /api/chat/conversations/:id
  fastify.delete('/conversations/:id', async (request, reply) => {
    // TODO: Delete conversation
    return { success: true };
  });
};
