# Intelligent Task Manager

Task manager built with `React + TypeScript + Vite` on the frontend and `NestJS + Prisma + SQLite` on the backend.  
The app supports task CRUD, server-side filtering and search, plus AI-powered category suggestions, priority suggestions, task decomposition, and workload summaries.

## Tech Stack

- Frontend: React, TypeScript, Vite, TanStack Query, React Hook Form, Zod
- Backend: NestJS, Prisma, SQLite, OpenAI SDK
- Shared contracts: workspace package with DTOs and Zod schemas

## Project Structure

```text
apps/
  api/      NestJS API
  web/      React frontend
packages/
  shared/   Shared schemas, DTOs, enums
scripts/
  setup.mjs Project setup helper
  dev.mjs   Runs frontend and backend together
```

## Requirements

- Node.js 20+
- npm 10+

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Run one-time project setup

```bash
npm run setup
```

What `npm run setup` does:

- creates `apps/api/.env` from `apps/api/.env.example` if it does not exist
- creates `apps/web/.env` from `apps/web/.env.example` if it does not exist
- builds the shared workspace package
- generates the Prisma client

### 3. Start the app

```bash
npm run dev
```

This starts:

- frontend: [http://localhost:5173](http://localhost:5173)
- backend API: [http://localhost:3001/api/v1](http://localhost:3001/api/v1)

## Environment Variables

Default local configuration is created automatically by `npm run setup`.

### Backend

File: `apps/api/.env`

```env
DATABASE_URL="file:./prisma/dev.db"
PORT=3001
LLM_PROVIDER=heuristic
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

### Frontend

File: `apps/web/.env`

```env
VITE_API_URL=http://localhost:3001/api/v1
```

## AI Modes

The project supports two AI modes:

- `LLM_PROVIDER=heuristic`  
  Local fallback mode. Works without any API key.

- `LLM_PROVIDER=openai`  
  Uses OpenAI Responses API with structured outputs.

To enable OpenAI, update `apps/api/.env`:

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
```

If OpenAI is unavailable, the backend falls back to heuristic behavior so the app remains usable.

## Available Scripts

```bash
npm run setup        # prepare env files, build shared package, generate Prisma client
npm run dev          # run frontend and backend together
npm run dev:api      # run only backend
npm run dev:web      # run only frontend
npm run build        # production build for all workspaces
npm run db:generate  # generate Prisma client
```

## Notes

- SQLite is used for local development.
- The backend ensures the local database schema exists on startup.
- Shared Zod schemas are reused between frontend and backend to keep request and response contracts consistent.

## Implemented Features

- Task CRUD
- Server-side filters by status, priority, and due date
- Full-text search by title and description
- AI category suggestion
- AI priority suggestion
- AI task decomposition into subtasks
- AI workload summary
- Structured API error responses

## Known Limitations

- No authentication or multi-user mode
- Delete confirmation uses the browser confirm dialog
- AI features are request/response based, without streaming

## What I Would Add Next

- End-to-end tests for CRUD and AI flows
- Swagger / OpenAPI documentation
- Docker Compose for one-command containerized startup
- Richer subtask workflows
