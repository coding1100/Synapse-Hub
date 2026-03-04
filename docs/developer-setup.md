# Developer Setup

## Prerequisites

- Node.js 20+
- npm 10+
- Docker + Docker Compose
- (Optional) Terraform CLI for IaC workflows

## Environment

1. Copy `.env.example` values into your shell or local `.env` file.
2. Ensure ports `3000`, `4000-4008`, `5432`, `6379`, `9200`, `9000`, `9090`, `3001`, `5601` are free.

## Install and build

```bash
npm install
npm run prisma:generate
npm run build
```

## Run app modes

### Full stack (recommended)

```bash
docker-compose up --build
```

### Local service run (manual)

```bash
npm run dev --workspace @synapsehub/api
npm run dev --workspace @synapsehub/auth-service
npm run dev --workspace @synapsehub/workspace-service
# ...run additional services as needed
npm run dev --workspace @synapsehub/web
```

## Database migration and seed

```bash
npm run prisma:migrate --workspace @synapsehub/shared
npm run prisma:seed --workspace @synapsehub/shared
```

## Test commands

```bash
npm run test:unit
npm run test:integration
npm run test:e2e
npm test
```

## Troubleshooting

- If Playwright fails with missing browser binaries, run `npx playwright install chromium`.
- If services fail on startup due to schema drift, re-run migration deploy:

```bash
npm run prisma:deploy --workspace @synapsehub/shared
```