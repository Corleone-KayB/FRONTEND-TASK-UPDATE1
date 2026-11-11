# Mindora III - Frontend

Next.js 16 frontend for the Mindora III project.

## Tech stack

| Category         | Library                             |
| ---------------- | ----------------------------------- |
| Framework        | Next.js 16 (App Router, TypeScript) |
| Styling          | Tailwind CSS v4                     |
| Data fetching    | Axios + TanStack Query v5           |
| State            | Zustand v5                          |
| Forms            | React Hook Form + Zod               |
| Testing          | Jest + React Testing Library        |
| CI               | GitHub Actions                      |
| Containerisation | Docker (multi-stage)                |

## Getting started

```bash
cp .env.example .env.local     # fill in your values
npm install
npm run dev                     # http://localhost:3000
```

## Scripts

| Command                 | Description         |
| ----------------------- | ------------------- |
| `npm run dev`           | Start dev server    |
| `npm run build`         | Production build    |
| `npm run test`          | Run tests           |
| `npm run test:coverage` | Tests with coverage |
| `npm run lint`          | Run ESLint          |
| `npm run format`        | Run Prettier        |
| `npm run type-check`    | TypeScript check    |

## Docker

```bash
# Production
docker compose up app

# Development (with hot-reload)
docker compose --profile dev up app-dev
```

## Project structure

```
src/
  app/           Next.js App Router pages and layouts
  components/    Reusable UI components
  hooks/         Custom React hooks (useGet, usePost, etc.)
  lib/           Core utilities (axios client, query client)
  providers/     React context providers
  store/         Zustand global state
  types/         Shared TypeScript types
  __tests__/     Tests
```

## Environment variables

See `.env.example` for all available variables. Set `NEXT_PUBLIC_API_URL` to your backend URL.

## CI

GitHub Actions runs on every push/PR to `main` and `develop`:

1. **Lint & Type Check** - ESLint + TypeScript
2. **Tests** - Jest with coverage artifact
3. **Build** - Next.js production build
4. **Docker Build** - only on `main`
