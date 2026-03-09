# SynapseHub Tech Stack and Container Reference

## Purpose

This document explains:

- Which technologies SynapseHub uses.
- Why each technology was selected.
- How the system is structured technically.
- The exact purpose of every local Docker container.

## System Model

SynapseHub is a web-only collaboration platform with:

- Multi-tenant workspaces.
- Workspace members, roles, and channel access control.
- Realtime messaging via WebSockets.
- REST APIs for CRUD workflows.
- Cross-service fan-out through Redis Pub/Sub.
- PostgreSQL as source-of-truth storage.
- Search through a dedicated search service.

## Tech Stack: What and Why

### Frontend (`apps/web`)

- `Next.js` (App Router): production web routing, server/client rendering support, optimized bundles.
- `React + TypeScript`: strict component contracts, maintainable UI code.
- `TailwindCSS`: fast and consistent design implementation.
- `React Query`: request caching, refetch control, and mutation state handling.

### API Edge (`apps/api`)

- `NestJS` API gateway: single entry point for browser calls.
- `http-proxy-middleware`: routes REST traffic to domain services.
- `Socket.IO gateway`: receives realtime events from web clients.
- `Redis Pub/Sub`: broadcasts realtime events across instances.

### Domain Services (`services/*`)

- `auth-service`: registration, login, token refresh/logout.
- `user-service`: user profile lookup/update and scoped user search.
- `workspace-service`: workspaces, members/roles, bots, integrations.
- `channel-service`: channel lifecycle and membership.
- `messaging-service`: messages, edits/deletes, reactions, threads.
- `notification-service`: notification records and read state.
- `file-service`: file metadata and S3 object references.
- `search-service`: workspace-scoped search over users/channels/messages/files.

### Data and Infra

- `PostgreSQL`: relational data, strong consistency, indexed joins.
- `Redis`: low-latency Pub/Sub for realtime fanout.
- `Elasticsearch`: optional advanced full-text search backend.
- `MinIO` (S3-compatible): object storage in local/dev.
- `Prisma ORM`: typed DB schema/client and migrations.
- `Docker + Compose`: reproducible local stack.
- `Kubernetes + Terraform`: production deployment and infra-as-code path.
- `Prometheus + Grafana + ELK`: metrics dashboards and centralized logs.

## Monorepo Structure

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

## Container Reference (docker-compose)

### Core data plane

- `postgres`
  - Port: `5432`
  - Stores: users, workspaces, channels, messages, reactions, files metadata, audit logs.
  - Criticality: hard dependency for all domain services.

- `redis`
  - Port: `6379`
  - Use case: realtime event propagation and queue/cache extension point.
  - Criticality: required for multi-instance realtime consistency.

- `elasticsearch`
  - Port: `9200`
  - Use case: advanced text indexing/search and ELK storage.
  - Notes: local stack runs with security disabled.

- `minio`
  - Ports: `9000` (S3 API), `9001` (console)
  - Use case: local object storage backend for file uploads.

### Observability

- `logstash`
  - Port: `5044`
  - Use case: pipeline for ingesting and transforming logs into Elasticsearch.

- `kibana`
  - Port: `5601`
  - Use case: log discovery, debugging, operational investigations.

- `prometheus`
  - Port: `9090`
  - Use case: scrape `/metrics` endpoints and store timeseries.

- `grafana`
  - Port: `3001` (mapped to container `3000`)
  - Use case: dashboards and alerting over Prometheus data.

### Platform control and apps

- `migrator`
  - Runs Prisma migration/deploy/push before app services start.
  - Use case: prevents runtime schema mismatch (`P2021` table-not-found errors).

- `api-gateway`
  - Port: `4000`
  - Use case: browser ingress for REST + websocket APIs.

- `auth-service` (`4001`)
  - Use case: JWT auth lifecycle and refresh token rotation.

- `user-service` (`4002`)
  - Use case: user read/update/search operations.

- `workspace-service` (`4003`)
  - Use case: workspace/member/role/bot/webhook-custom integration domain logic.

- `channel-service` (`4004`)
  - Use case: workspace channel management and membership.

- `messaging-service` (`4005`)
  - Use case: message lifecycle, threading, reactions.

- `notification-service` (`4006`)
  - Use case: notification inbox and read state.

- `file-service` (`4007`)
  - Use case: file metadata and S3 URL references.

- `search-service` (`4008`)
  - Use case: workspace-scoped search API.

- `web`
  - Port: `3000`
  - Use case: Next.js web client.

## Dependency Graph (runtime)

1. Browser calls `web` and `api-gateway`.
2. `api-gateway` proxies to domain services.
3. Domain services use `postgres` for persistence.
4. Realtime events fan out through `redis` and websocket rooms.
5. Logs and metrics flow to ELK/Prometheus/Grafana.

## Common Operational Issue

### Error: `The table public.User does not exist (P2021)`

Cause:

- Database schema was not applied, or app services started before migration completed.

Resolution:

1. Ensure `migrator` finishes successfully before service startup.
2. Re-run migration job if needed:

```bash
npm run prisma:deploy --workspace @synapsehub/shared
npm run prisma:push --workspace @synapsehub/shared
```

3. If schema history is corrupted in local dev, recreate DB volume and restart:

```bash
docker-compose down -v
docker-compose up --build
```

## Current Scope Exclusions

- Microsoft Purview eDiscovery
- Product connectors for GitHub/Jira/ServiceNow/PagerDuty
- External identity providers (Google/GitHub OAuth, SSO IdPs, SCIM provisioning)
- Stripe billing/customer portal integrations
