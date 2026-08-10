# API Documentation

## Overview

The Agentic Creator OS backend exposes a REST API with SSE streaming and WebSocket support.

**Base URL:** `http://localhost:3000` (development) or your deployed URL

**Authentication:** Bearer token in `Authorization` header
```
Authorization: Bearer <jwt_token>
```

---

## Authentication

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "creator@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "expiresIn": 604800,
  "user": {
    "id": "uuid",
    "email": "creator@example.com",
    "creatorId": "uuid"
  }
}
```

### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "creator@example.com",
  "password": "securepassword123",
  "displayName": "My Channel"
}
```

### Refresh Token

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "..."
}
```

### Get Current User

```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Connect YouTube

```http
POST /api/auth/youtube/connect
Authorization: Bearer <token>

{
  "redirectUri": "your-app://oauth/youtube"
}
```

**Response:**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

### YouTube OAuth Callback

```http
POST /api/auth/youtube/callback
Authorization: Bearer <token>

{
  "code": "4/0AX4XfWi...",
  "redirectUri": "your-app://oauth/youtube"
}
```

---

## Chat (Agent)

### Stream Chat (SSE)

Send a message to the AI agent and receive streaming response.

```http
POST /api/chat/stream
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "What should I focus on today?",
  "conversationId": "uuid-optional"
}
```

**Response:** Server-Sent Events stream

```
data: {"type":"message_start","conversationId":"uuid"}

data: {"type":"text","content":"Based on your "}

data: {"type":"text","content":"current priorities..."}

data: {"type":"tool_call","id":"tc_1","tool":"calculateImpact","args":{}}

data: {"type":"tool_result","id":"tc_1","result":{"topAction":{...}}}

data: {"type":"text","content":"I recommend focusing on..."}

data: {"type":"done","messageId":"uuid"}
```

**Event Types:**

| Type | Description |
|------|-------------|
| `message_start` | Stream started, includes `conversationId` |
| `text` | Partial text content (streaming) |
| `tool_call` | Agent calling a tool |
| `tool_result` | Tool execution result |
| `error` | Error occurred |
| `done` | Stream complete |

### WebSocket Chat

```javascript
const ws = new WebSocket('ws://localhost:3000/api/chat/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    message: "What should I focus on today?",
    conversationId: "uuid-optional"
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.type, data.content);
};
```

### List Conversations

```http
GET /api/chat/conversations
Authorization: Bearer <token>
```

**Response:**
```json
{
  "conversations": [
    {
      "id": "uuid",
      "title": "Task Planning",
      "isArchived": false,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Get Conversation

```http
GET /api/chat/conversations/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "conversation": {
    "id": "uuid",
    "title": "Task Planning",
    "messages": [
      {
        "id": "uuid",
        "role": "user",
        "content": "What should I do today?",
        "createdAt": "2024-01-15T10:00:00Z"
      },
      {
        "id": "uuid",
        "role": "assistant",
        "content": "Based on your priorities...",
        "toolCalls": [...],
        "createdAt": "2024-01-15T10:00:05Z"
      }
    ]
  }
}
```

### Delete Conversation

```http
DELETE /api/chat/conversations/:id
Authorization: Bearer <token>
```

---

## Tasks

### List Tasks

```http
GET /api/tasks
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` - Filter by status (pending, in_progress, completed, cancelled)
- `priority` - Filter by priority (low, medium, high, urgent)
- `dueBefore` - Filter by due date (ISO 8601)
- `limit` - Number of results (default: 50)
- `offset` - Pagination offset

**Response:**
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Edit sponsor segment",
      "description": "Add sponsor read for XYZ brand",
      "status": "pending",
      "priority": "high",
      "dueDate": "2024-01-20T17:00:00Z",
      "tags": ["sponsor", "editing"],
      "progress": 0,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Create Task

```http
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Edit sponsor segment",
  "description": "Add sponsor read for XYZ brand",
  "priority": "high",
  "dueDate": "2024-01-20T17:00:00Z",
  "tags": ["sponsor", "editing"]
}
```

### Get Task

```http
GET /api/tasks/:id
Authorization: Bearer <token>
```

### Update Task

```http
PATCH /api/tasks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "in_progress",
  "progress": 50
}
```

### Delete Task

```http
DELETE /api/tasks/:id
Authorization: Bearer <token>
```

### Set Reminder

```http
POST /api/tasks/:id/reminder
Authorization: Bearer <token>
Content-Type: application/json

{
  "remindAt": "2024-01-20T09:00:00Z",
  "message": "Don't forget to edit sponsor segment!"
}
```

---

## Content

### List Ideas

```http
GET /api/content/ideas
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` - new, considering, approved, rejected, in_pipeline
- `format` - long_form, short, live, series
- `limit`, `offset`

### Create Idea

```http
POST /api/content/ideas
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "How I Built My Studio Setup",
  "description": "Tour of my setup with gear recommendations",
  "format": "long_form",
  "tags": ["studio", "setup", "gear"]
}
```

### Generate Ideas (AI)

```http
POST /api/content/ideas/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "count": 5,
  "format": "long_form"
}
```

**Response:**
```json
{
  "ideas": [
    {
      "id": "uuid",
      "title": "AI-Generated Idea",
      "description": "Based on your audience patterns...",
      "source": "ai_generated",
      "impactScore": 85.5
    }
  ]
}
```

### Get Pipeline

```http
GET /api/content/pipeline
Authorization: Bearer <token>
```

### List Sponsorships

```http
GET /api/content/sponsorships
Authorization: Bearer <token>
```

### Get Sponsorship Deliverables

```http
GET /api/content/sponsorships/:id/deliverables
Authorization: Bearer <token>
```

---

## YouTube

### Get Channel

```http
GET /api/youtube/channel
Authorization: Bearer <token>
```

**Response:**
```json
{
  "channel": {
    "id": "uuid",
    "channelId": "UC...",
    "title": "My Channel",
    "subscriberCount": 150000,
    "videoCount": 200,
    "viewCount": 5000000,
    "lastSyncedAt": "2024-01-15T03:00:00Z"
  }
}
```

### List Videos

```http
GET /api/youtube/videos
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` - Number of results (default: 20)
- `offset` - Pagination offset
- `sort` - publishedAt, viewCount, likeCount

### Get Video

```http
GET /api/youtube/videos/:id
Authorization: Bearer <token>
```

### Get Video Analytics

```http
GET /api/youtube/videos/:id/analytics
Authorization: Bearer <token>
```

**Query Parameters:**
- `dateRange` - 7d, 28d, 90d, lifetime

### Get Channel Analytics

```http
GET /api/youtube/analytics
Authorization: Bearer <token>
```

### Trigger Sync

```http
POST /api/youtube/sync
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullSync": false
}
```

### Get Insights

```http
GET /api/youtube/insights
Authorization: Bearer <token>
```

---

## Impact Scores

### Get Top Recommendation

```http
GET /api/impact/recommendation
Authorization: Bearer <token>
```

**Response:**
```json
{
  "recommendation": {
    "entityType": "task",
    "entityId": "uuid",
    "title": "Edit sponsor segment",
    "totalScore": 87.5,
    "breakdown": {
      "urgency": 23,
      "revenue": 18,
      "audience": 12,
      "goalAlignment": 14,
      "effort": 8,
      "momentum": 10
    },
    "reasoning": "High priority due to upcoming deadline and revenue impact..."
  }
}
```

### Get All Scores

```http
GET /api/impact/scores
Authorization: Bearer <token>
```

---

## Briefing

### Get Latest Briefing

```http
GET /api/briefing/latest
Authorization: Bearer <token>
```

**Response:**
```json
{
  "briefing": {
    "id": "uuid",
    "briefingDate": "2024-01-15",
    "greeting": "Good morning! Here's your daily briefing...",
    "topPriorities": [
      {
        "title": "Edit sponsor segment",
        "description": "Due in 2 days",
        "impactScore": 87.5
      }
    ],
    "keyMetrics": {
      "subscriberChange": 250,
      "viewsLast7Days": 45000,
      "viewsChange": 12.5
    },
    "opportunities": [...],
    "warnings": [...],
    "isRead": false
  }
}
```

### Generate Briefing

```http
POST /api/briefing/generate
Authorization: Bearer <token>
```

### Mark as Read

```http
POST /api/briefing/:id/read
Authorization: Bearer <token>
```

---

## Webhooks

### YouTube Push Notification

```http
POST /api/webhooks/youtube
```

### Supabase Database Webhook

```http
POST /api/webhooks/supabase
```

---

## Error Responses

All errors follow a consistent format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human readable message",
  "details": {}
}
```

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `BAD_REQUEST` | 400 | Invalid request data |
| `CONFLICT` | 409 | Resource conflict |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/chat/*` | 60 | 1 minute |
| `/api/youtube/sync` | 5 | 1 hour |
| `/api/briefing/generate` | 10 | 1 day |
| All other endpoints | 100 | 1 minute |

Headers included in responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1704067200
```

---

## TypeScript Client

Use the `@agentic-creator/api-client` package:

```typescript
import { createApiClient } from '@agentic-creator/api-client';

const api = createApiClient({
  baseUrl: 'http://localhost:3000',
  getToken: async () => getStoredToken(),
});

// List tasks
const { data: tasks } = await api.tasks.list({ status: 'pending' });

// Create task
const { data: task } = await api.tasks.create({
  title: 'Edit video',
  priority: 'high',
});

// Stream chat
const token = await getStoredToken();
for await (const event of api.chat.stream(baseUrl, token, 'Hello!')) {
  console.log(event.type, event.content);
}
```
