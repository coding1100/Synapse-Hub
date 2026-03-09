# SynapseHub

SynapseHub is a Slack-like, production-focused collaboration platform built as a TypeScript monorepo.

## Platform capabilities

- Multi-workspace tenancy
- Email verification and password reset flows
- Public/private/direct channels
- Direct messages and threaded replies
- Realtime messaging over Socket.IO + Redis Pub/Sub
- File metadata + S3-compatible object storage wiring
- In-app notifications
- Search service with Elasticsearch integration path
- Bot API and slash command execution
- Internal automation integrations via webhooks and custom events
- Role-based invite links with expiry/domain/email constraints
- Admin-facing web console
- Docker, Kubernetes, Terraform, Prometheus/Grafana/ELK support

## Monorepo layout

```text
synapsehub/
  apps/
    api/
    web/
  services/
    auth-service/
    user-service/
    workspace-service/
    channel-service/
    messaging-service/
    notification-service/
    file-service/
    search-service/
  packages/
    ui/
    shared/
  infrastructure/
    docker/
    kubernetes/
    terraform/
  scripts/
  docs/
```

## Quick start (local)

1. Install dependencies:

```bash
npm install
```

2. Apply DB schema once (or whenever Prisma schema changes):

```bash
docker-compose up --build migrator
```

3. Start the full local stack:

```bash
docker-compose up --build
```

4. Open services:

- Web app: `http://localhost:3000`
- API gateway: `http://localhost:4000`
- Grafana: `http://localhost:3001` (`admin` / `admin`)
- Prometheus: `http://localhost:9090`
- Kibana: `http://localhost:5601`
- MinIO Console: `http://localhost:9001`

5. Seed initial data (optional, host environment):

```bash
npm run prisma:seed --workspace @synapsehub/shared
```

## Troubleshooting

- `P2021 The table public.User does not exist`

```bash
docker-compose down -v
docker-compose up --build migrator
docker-compose up --build
```

## Core scripts

```bash
npm run build
npm test
npm run test:e2e
npm run prisma:generate
npm run prisma:migrate
```

## Documentation index

- [Architecture Overview](docs/architecture-overview.md)
- [Tech Stack and Containers](docs/tech-stack-and-containers.md)
- [API Documentation](docs/api-documentation.md)
- [Developer Setup](docs/developer-setup.md)
- [Deployment Guide](docs/deployment-guide.md)
- [Observability Guide](docs/observability.md)

## Security baseline

- JWT + refresh token auth
- bcrypt password hashing
- Role-based workspace permissions
- Request validation and whitelisting
- Audit logs for integration events and workspace operations
- Rate-limit and CSRF expansion points documented for production hardening
