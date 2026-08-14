# Running the App — Local Setup

This is a manual, from-scratch guide to get the backend and the mobile app
running on your machine (Windows). It captures what actually worked when this
was set up, including the gotchas.

## Prerequisites

| Tool | Why | Notes |
|---|---|---|
| Node.js 20+ | Runs backend + Expo tooling | v22 confirmed working |
| pnpm | Monorepo package manager | see [pnpm](#1-install-pnpm) below if not installed |
| Docker Desktop + WSL2 | Local Postgres (pgvector) + Redis | see [Docker/WSL2](#2-docker-desktop--wsl2) below |
| Android Studio (optional) | Android emulator, if you want to run as a native mobile app instead of web | not required to view the app in a browser |

---

## 1. Install pnpm

If `pnpm` isn't recognized:

```bash
npm install -g pnpm
```

(`corepack enable` is the "official" route, but on Windows it can fail with an
`EPERM` on `C:\Program Files\nodejs\yarn.CMD` if the shell isn't elevated —
`npm install -g pnpm` sidesteps that.)

## 2. Docker Desktop + WSL2

Docker Desktop on Windows requires WSL2 as its backend.

1. Install Docker Desktop.
2. If `docker ps` returns a `500 Internal Server Error` about
   `dockerDesktopLinuxEngine`, WSL2 isn't installed. Open an **admin**
   PowerShell and run:
   ```powershell
   wsl --install
   ```
3. Reboot.
4. Start Docker Desktop and confirm it's healthy:
   ```powershell
   docker ps
   ```

If `docker` isn't on `PATH` after install, Docker Desktop may have installed
under your user profile instead of `C:\Program Files`. Find it with:

```powershell
Get-Process "Docker Desktop" | Select-Object Path
```

The CLI binary is at `...\DockerDesktop\resources\bin\docker.exe` in that case.

---

## 3. Environment files

Two `.env` files are needed — **they are not checked into git**, create them
from the `.env.example` in each app:

- `apps/backend/.env` — server port, `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`,
  Supabase URL + **service role** key, `GOOGLE_API_KEY` (Gemini),
  `YOUTUBE_CLIENT_ID`/`SECRET`.
- `apps/mobile/.env` — `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  (the **anon/public** key, not the service key), `EXPO_PUBLIC_API_URL`
  (`http://localhost:3000` for local dev).

For local Docker Postgres/Redis, `DATABASE_URL` and `REDIS_URL` in the backend
`.env` should point at `localhost`:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agentic_creator
REDIS_URL=redis://localhost:6379
```

Supabase is still used even in local-Docker mode — for verifying user auth
tokens, not for data storage (data lives in the local Postgres container).

---

## 4. Install dependencies

From the repo root:

```bash
pnpm install
```

---

## 5. Start Postgres + Redis (Docker)

```bash
cd apps/backend
docker compose up -d db redis
```

First run pulls the `pgvector/pgvector:pg16` and `redis:7-alpine` images
(~10 layers, can take a few minutes). Confirm both are up:

```bash
docker ps
```

You should see `backend-db-1` and `backend-redis-1` with status `Up`.

## 6. Run database migrations

```bash
cd apps/backend
pnpm db:generate   # generates SQL from src/db/schema.ts (only needed after schema changes)
pnpm db:migrate    # applies migrations to the DB
```

`drizzle-kit` reads `apps/backend/.env` automatically for `DATABASE_URL`.

---

## 7. Run the backend

```bash
cd apps/backend
pnpm dev
```

This runs `tsx watch --env-file=.env src/server.ts`. On success you'll see:

```
Database connected
Redis connected
Queues initialized
Server listening at http://127.0.0.1:3000
```

Verify:

```bash
curl http://localhost:3000/health
# {"status":"ok","timestamp":"..."}
```

> **Note:** the scaffolding originally had no `.env` loading at all (no
> `dotenv`, no `--env-file`) — `env.ts` would throw immediately on boot. This
> is fixed by adding `--env-file=.env` to the `dev`/`start`/`start:worker`
> scripts (Node 20.6+ supports this natively, no extra dependency).

---

## 8. Run the frontend — Web (fastest way to see it)

```bash
cd apps/mobile
pnpm web
```

First time only, install the web renderer (the scaffolding didn't include it):

```bash
npx expo install react-native-web react-dom @expo/metro-runtime
```

Then open **http://localhost:8081** in your browser.

---

## 9. Run the frontend — Android emulator

### One-time: create a virtual device

Android Studio's SDK Manager needs at least one system image installed
(Device Manager will prompt you to download one if none exists), then:

1. Open **Android Studio → More Actions → Virtual Device Manager** (or the
   Device Manager panel inside a project).
2. **Create Device** → pick any phone profile (e.g. Pixel 6) → pick a system
   image → **Finish**.
3. Start the emulator from the Device Manager (▶ button).

   Headless creation via `avdmanager` is possible in theory but the legacy
   `<sdk>/tools/bin/avdmanager.bat` shipped with older SDK installs breaks on
   modern JDKs (`NoClassDefFoundError: javax/xml/bind/...`) — using Android
   Studio's GUI avoids this entirely.

### Every time: launch the app into it

With the emulator running (confirm via `adb devices`):

```bash
cd apps/mobile
pnpm android
```

This boots Metro and installs/launches the app in the running emulator.

### Alternative: physical phone, no emulator at all

1. Install **Expo Go** from the Play Store on your phone.
2. Make sure the phone is on the same WiFi as this machine.
3. Run `pnpm start` in `apps/mobile` and scan the printed QR code with Expo Go.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `pnpm: command not found` | `npm install -g pnpm` |
| `docker: command not found` after installing Docker Desktop | Find `docker.exe` under the Docker Desktop install dir (may be under `%LOCALAPPDATA%\Programs\DockerDesktop` instead of `Program Files`) and call it directly, or open a fresh shell/terminal so `PATH` picks up the installer's changes |
| `docker ps` → `500 Internal Server Error ... dockerDesktopLinuxEngine` | WSL2 not installed — `wsl --install` (admin), then reboot |
| Backend crashes immediately with a Zod env validation error | `apps/backend/.env` is missing or incomplete — check it has `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `GOOGLE_API_KEY`, `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET` |
| `expo start --web` warns `react-native-web is not installed` | `npx expo install react-native-web react-dom @expo/metro-runtime` |
| `avdmanager` throws `NoClassDefFoundError` | Use Android Studio's GUI Device Manager instead of the legacy CLI tool |
