# Architecture Overview

## High-level topology

SynapseHub uses a microservices architecture with API gateway aggregation.

- `apps/api`: gateway + websocket realtime edge
- `services/*`: domain services (auth, users, workspace, channel, messaging, notifications, files, search)
- `packages/shared`: Prisma schema, database artifacts, shared utility code
- `packages/ui`: reusable frontend component primitives

## Request and event flows

### REST flow

1. Client sends REST request to API gateway.
2. API gateway reverse-proxies route to the target service.
3. Target service processes request and persists state in PostgreSQL (Prisma).
4. Response returns through gateway.

### Realtime flow

1. Client connects to gateway socket namespace `/ws` using JWT access token.
2. Gateway validates token and joins user/channel rooms.
3. Socket events (`message:send`, `message:edit`, `thread:reply`, `typing:start`) are forwarded to messaging endpoints.
4. Gateway publishes event envelopes to Redis Pub/Sub.
5. All gateway instances consume Redis events and broadcast to subscribers for horizontal scale.

### Integration and bot flow

1. Admin creates bot/integration in `workspace-service`.
2. External systems post events to integration endpoints.
3. Integration events are captured into `AuditLog` and optionally forwarded to bot workflows.
4. Bots can execute slash commands and emit bot-authored messages.

## Data model

Prisma schema includes:

- Users, OAuth accounts, refresh tokens
- Workspaces and memberships
- Channels and channel memberships
- Messages, threads, reactions
- Files and notifications
- Bots, bot events
- Integrations
- Audit logs

Indexing strategy supports:

- Workspace and channel listing
- Message timelines and thread views
- Notification inbox performance
- Audit log inspection

## Scale strategy

- Stateless services for horizontal pod scaling
- Redis for fan-out and cross-instance socket coherence
- PostgreSQL primary datastore with indexed relational model
- Elasticsearch service for content search workloads
- S3-compatible object storage for file payloads
- Prometheus/Grafana/ELK for operational visibility