# SynapseHub Tech Stack and Container Reference

## Purpose

This document explains:

- What technology stack SynapseHub uses
- Why each technology was selected
- Core technical behavior of the application
- The purpose and use case of every Docker container

## Application Technical Model

SynapseHub is a web-only, Slack-like collaboration system designed around:

- Workspace-based multi-tenancy
- Channel and thread communication
- Realtime event delivery
- Microservice isolation by domain
- Event fan-out using Redis Pub/Sub
- Central gateway for client traffic
- Relational persistence in PostgreSQL
- Search expansion path via Elasticsearch
- Observability via metrics and logs

## Technology Stack and Why

### Frontend

- Next.js (App Router): server/client rendering flexibility, production-grade web routing, optimization, and deployment maturity.
- React + TypeScript: componentized UI architecture with strict type safety for large codebases.
- TailwindCSS: fast, consistent design system implementation and maintainable utility-based styling.
- React Query: API state caching, background refetch, optimistic UX, and reduced request duplication.

### Backend

- Node.js + NestJS + TypeScript: modular architecture, DI patterns, predictable service boundaries, and scalable team maintenance.
- Prisma ORM: strongly typed DB access, schema-driven migrations, and safer query development.
- JWT + refresh tokens + bcrypt: stateless auth with secure password hashing and renewable session flow.

### Realtime Layer

- Socket.IO: robust WebSocket abstraction with reconnect behavior and room semantics.
- Redis Pub/Sub: cross-instance broadcast so realtime messages scale horizontally beyond one API node.

### Data Layer

- PostgreSQL: transactional consistency, relational modeling, indexing, and strong query capabilities.
- Elasticsearch: dedicated full-text search backend for messages, files, users, and channels.
- S3-compatible object storage (MinIO locally / S3 in cloud): scalable binary file storage separate from relational metadata.

### Infrastructure and Ops

- Docker + Docker Compose: reproducible local and CI environments.
- Kubernetes: orchestrated production deployment and horizontal scaling.
- Terraform: infrastructure as code for versioned cloud provisioning.
- GitHub Actions: automated test/build/publish/deploy pipeline.
- Prometheus + Grafana + ELK: metrics, dashboards, and centralized logging.

## Service Map (Logical)

- `apps/api`: gateway + websocket edge
- `services/auth-service`: authentication and token lifecycle
- `services/user-service`: user profile and lookup
- `services/workspace-service`: workspace domain, roles, bots, integrations
- `services/channel-service`: channel CRUD/membership
- `services/messaging-service`: messages, threads, reactions
- `services/notification-service`: notification persistence/delivery state
- `services/file-service`: file metadata, S3 object references
- `services/search-service`: index + query operations
- `apps/web`: browser application

## Container-by-Container Purpose (docker-compose)

### Data and Platform Containers

- `postgres`
  - Use case: source-of-truth relational datastore (users, messages, channels, memberships, audit logs, etc.).

- `redis`
  - Use case: low-latency pub/sub backbone for realtime fan-out across websocket instances; queue/cache expansion point.

- `elasticsearch`
  - Use case: full-text indexing/query engine for application-wide search.

- `minio`
  - Use case: S3-compatible object store for uploaded files in local/dev environments.

### ELK Observability Containers

- `logstash`
  - Use case: log ingestion and routing pipeline into Elasticsearch.

- `kibana`
  - Use case: log exploration and operational troubleshooting UI.

### Metrics Observability Containers

- `prometheus`
  - Use case: scrape service `/metrics` endpoints and store time-series metrics.

- `grafana`
  - Use case: visualization/dashboarding and alerting over Prometheus metrics.

### Migration and App Containers

- `migrator`
  - Use case: applies Prisma migrations before app services boot, preventing schema drift runtime failures.

- `api-gateway`
  - Use case: single ingress for web client REST + websocket traffic; routes requests to internal services.

- `auth-service`
  - Use case: user registration/login/refresh/logout/OAuth callbacks.

- `user-service`
  - Use case: user profile retrieval/update and search.

- `workspace-service`
  - Use case: workspace management, member roles, bot APIs, integration event handling.

- `channel-service`
  - Use case: channel create/list/join/leave/archive.

- `messaging-service`
  - Use case: message CRUD, reactions, thread creation/replies, ordering sequence management.

- `notification-service`
  - Use case: notification creation, read-state tracking, inbox retrieval.

- `file-service`
  - Use case: file metadata and object URL handling for uploads/downloads/deletes.

- `search-service`
  - Use case: indexing endpoints and multi-entity search query execution.

- `web`
  - Use case: Next.js user interface served on port 3000.

## Typical Runtime Flow

1. Browser calls `api-gateway` (`/auth`, `/messages`, `/channels`, etc.).
2. Gateway proxies to the target domain service.
3. Service persists/reads data via PostgreSQL.
4. Realtime actions publish events through Redis and websocket rooms.
5. Search-relevant data is indexed in Elasticsearch.
6. Metrics are scraped by Prometheus; logs are searchable in Kibana.

## Notes About Registration Errors

If registration fails on `/register`, common causes are:

- Email already exists in PostgreSQL (`Email already exists`).
- Target auth service unreachable or proxy misconfiguration.
- Validation failure (invalid email, weak password under DTO rules).

The register page now surfaces backend error text directly to make the failure reason explicit.