# Deployment Guide

## Overview

This guide covers deploying the Agentic Creator OS stack:
- **Backend**: Node.js API server + workers
- **Mobile**: React Native app via EAS
- **Database**: Supabase PostgreSQL
- **Redis**: Upstash (serverless)

---

## Prerequisites

- Supabase account
- Railway, Render, or Fly.io account
- Upstash account (for Redis)
- Apple Developer account (for iOS)
- Google Play Developer account (for Android)
- EAS account (Expo Application Services)

---

## 1. Database Setup (Supabase)

### Create Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your:
   - Project URL
   - Anon key
   - Service role key
   - Database connection string

### Enable Extensions

```sql
-- Run in SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;
```

### Run Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref <your-project-ref>

# Push migrations
supabase db push
```

Or run the SQL manually from `supabase/migrations/`.

---

## 2. Redis Setup (Upstash)

1. Go to [upstash.com](https://upstash.com)
2. Create a new Redis database
3. Choose region close to your backend
4. Copy the Redis URL (with password)

```
REDIS_URL=rediss://default:xxx@xxx.upstash.io:6379
```

---

## 3. Backend Deployment

### Option A: Railway (Recommended)

1. **Create Railway project**
   ```bash
   npm install -g @railway/cli
   railway login
   cd apps/backend
   railway init
   ```

2. **Add environment variables**
   ```bash
   railway variables set DATABASE_URL="postgresql://..."
   railway variables set REDIS_URL="rediss://..."
   railway variables set JWT_SECRET="your-32-char-secret"
   railway variables set OPENAI_API_KEY="sk-..."
   railway variables set ANTHROPIC_API_KEY="sk-ant-..."
   railway variables set YOUTUBE_CLIENT_ID="..."
   railway variables set YOUTUBE_CLIENT_SECRET="..."
   railway variables set SUPABASE_URL="https://xxx.supabase.co"
   railway variables set SUPABASE_SERVICE_KEY="eyJ..."
   ```

3. **Deploy**
   ```bash
   railway up
   ```

4. **Deploy worker** (separate service)
   ```bash
   railway service create worker
   railway variables set ... # Same as above
   # Set start command to: npm run start:worker
   railway up
   ```

### Option B: Render

1. Create `render.yaml` in project root:
   ```yaml
   services:
     - type: web
       name: agentic-backend
       runtime: node
       region: oregon
       plan: starter
       buildCommand: cd apps/backend && npm install && npm run build
       startCommand: cd apps/backend && npm start
       healthCheckPath: /health
       envVars:
         - key: NODE_ENV
           value: production
         - key: DATABASE_URL
           sync: false
         - key: REDIS_URL
           sync: false
         # Add all other env vars

     - type: worker
       name: agentic-worker
       runtime: node
       region: oregon
       plan: starter
       buildCommand: cd apps/backend && npm install && npm run build
       startCommand: cd apps/backend && npm run start:worker
       envVars:
         # Same as web service
   ```

2. Connect repo and deploy from Render dashboard

### Option C: Fly.io

1. Create `fly.toml` in `apps/backend/`:
   ```toml
   app = "agentic-creator-backend"
   primary_region = "sjc"

   [build]
     dockerfile = "Dockerfile"

   [http_service]
     internal_port = 3000
     force_https = true
     auto_stop_machines = true
     auto_start_machines = true
     min_machines_running = 1

   [env]
     NODE_ENV = "production"
   ```

2. Deploy:
   ```bash
   cd apps/backend
   fly launch
   fly secrets set DATABASE_URL="..." REDIS_URL="..." # etc.
   fly deploy
   ```

### Option D: Docker (Self-hosted)

```bash
cd apps/backend

# Build image
docker build -t agentic-backend .

# Run API server
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e REDIS_URL="..." \
  --name agentic-api \
  agentic-backend

# Run worker
docker run -d \
  -e DATABASE_URL="..." \
  -e REDIS_URL="..." \
  --name agentic-worker \
  agentic-backend npm run start:worker
```

---

## 4. Mobile App Deployment

### Configure EAS

```bash
cd apps/mobile

# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure
```

### Update `eas.json`

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-staging-api.com"
      }
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-api.com",
        "EXPO_PUBLIC_SUPABASE_URL": "https://xxx.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "eyJ..."
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Build

```bash
# iOS build
eas build --platform ios --profile production

# Android build
eas build --platform android --profile production

# Both
eas build --platform all --profile production
```

### Submit to Stores

```bash
# App Store
eas submit --platform ios

# Google Play
eas submit --platform android
```

---

## 5. YouTube API Setup

### Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select project
3. Enable APIs:
   - YouTube Data API v3
   - YouTube Analytics API
4. Create OAuth 2.0 Client ID
5. Add redirect URIs:
   - `your-app-scheme://oauth/youtube`
   - `https://your-domain.com/oauth/youtube`

### Request Quota Increase

Default: 10,000 units/day. For production:
1. Go to Quotas page
2. Request increase for YouTube Data API v3
3. Provide justification

---

## 6. Push Notifications

### Expo Push Setup

1. Configure in `apps/mobile/app.json`:
   ```json
   {
     "expo": {
       "plugins": [
         [
           "expo-notifications",
           {
             "icon": "./assets/notification-icon.png",
             "color": "#ffffff"
           }
         ]
       ]
     }
   }
   ```

2. Get Expo access token:
   ```bash
   eas credentials
   ```

3. Set in backend environment:
   ```
   EXPO_ACCESS_TOKEN=your-token
   ```

### FCM (Android)

1. Create Firebase project
2. Add Android app with package name
3. Download `google-services.json`
4. Upload to EAS:
   ```bash
   eas credentials
   # Select Android > Push Notifications
   ```

---

## 7. Environment Variables Summary

### Backend (.env.production)

```bash
# Server
NODE_ENV=production
PORT=3000
CORS_ORIGINS=https://your-app.com

# Database
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres

# Redis
REDIS_URL=rediss://default:xxx@xxx.upstash.io:6379

# Auth
JWT_SECRET=your-32-character-minimum-secret-key
JWT_EXPIRES_IN=7d

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# LLM - Google Gemini
GOOGLE_API_KEY=AIza...

# YouTube
YOUTUBE_CLIENT_ID=xxx.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=xxx

# Push
EXPO_ACCESS_TOKEN=xxx
```

### Mobile (via EAS)

```bash
EXPO_PUBLIC_API_URL=https://your-api.railway.app
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## 8. Monitoring

### Logging

Backend uses Fastify's built-in logger. View logs:

```bash
# Railway
railway logs

# Render
render logs

# Fly.io
fly logs
```

### Error Tracking (Optional)

Add Sentry:

```bash
cd apps/backend
npm install @sentry/node

cd apps/mobile
npx expo install @sentry/react-native
```

### Uptime Monitoring

Use services like:
- [Better Uptime](https://betteruptime.com)
- [UptimeRobot](https://uptimerobot.com)

Monitor `/health` endpoint.

---

## 9. Scaling

### Backend Scaling

| Platform | How to Scale |
|----------|--------------|
| Railway | Increase replicas in settings |
| Render | Upgrade plan, add instances |
| Fly.io | `fly scale count 3` |

### Worker Scaling

Run multiple worker instances - BullMQ handles job distribution automatically.

### Database Scaling

- Enable connection pooling (Supabase built-in)
- Upgrade to larger instance if needed
- Consider read replicas for heavy read loads

---

## 10. Maintenance

### Regular Tasks

- **Weekly**: Review error logs
- **Monthly**: Update dependencies, rotate API keys
- **Quarterly**: Review RLS policies, consolidate memories

### Database Maintenance

```sql
-- Run periodically
VACUUM ANALYZE;

-- Reindex vector search
REINDEX INDEX idx_agent_memory_embedding;

-- Clean old data (optional)
DELETE FROM messages WHERE created_at < NOW() - INTERVAL '1 year';
```

### Dependency Updates

```bash
# Check for updates
pnpm outdated

# Update
pnpm update

# Update Expo SDK
cd apps/mobile
npx expo install expo@latest
```

---

## 11. Rollback

### Railway

```bash
railway rollback
```

### Fly.io

```bash
fly releases
fly deploy --image <previous-image>
```

### Mobile

Previous builds remain available in app stores. Users receive updates automatically.

---

## Troubleshooting

### Backend won't start

1. Check environment variables are set
2. Verify database connection
3. Check Redis connection
4. Review logs for errors

### Workers not processing jobs

1. Verify Redis connection
2. Check worker logs
3. Ensure queues are initialized

### Push notifications not working

1. Verify Expo access token
2. Check device has valid push token
3. Verify notification payload format

### Database connection errors

1. Check connection string
2. Verify IP allowlist (if applicable)
3. Check connection pool limits
