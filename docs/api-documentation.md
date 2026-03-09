# API Documentation

Base URL (gateway): `http://localhost:4000`

## Authentication

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/verify-email`
- `POST /auth/resend-verification`

## Users

- `GET /users/me`
- `GET /users/:id`
- `PATCH /users/:id`
- `GET /users?q=&cursor=&limit=`

## Workspaces

- `POST /workspaces`
- `GET /workspaces`
- `GET /workspaces/:id/members`
- `POST /workspaces/:id/invite`
- `POST /workspaces/:id/invite-links`
- `GET /workspaces/:id/invite-links`
- `POST /workspaces/:id/invite-links/:inviteLinkId/revoke`
- `POST /workspaces/invite-links/:code/accept`
- `PATCH /workspaces/:id/members/:userId/role`

## Channels

- `POST /channels`
- `GET /channels?workspaceId=`
- `POST /channels/:id/join`
- `POST /channels/:id/leave`
- `POST /channels/:id/archive`

## Messaging and threads

- `POST /messages`
- `GET /messages?channelId=&cursor=&limit=`
- `PATCH /messages/:id`
- `DELETE /messages/:id`
- `POST /messages/:id/reactions`
- `POST /threads`
- `POST /threads/:id/replies`
- `GET /threads/:id`

## Files

- `POST /files/upload`
- `GET /files/:id`
- `DELETE /files/:id`

## Notifications

- `POST /notifications/emit`
- `GET /notifications/:userId`
- `PATCH /notifications/:id/read`

## Search

- `POST /search/index`
- `GET /search?q=&workspaceId=&type=`

## Bots

- `POST /bots`
- `GET /bots?workspaceId=`
- `POST /bots/:id/events`
- `POST /bots/:id/commands`
- `POST /bots/:id/messages`

## Integrations

- `POST /integrations`
- `GET /integrations?workspaceId=&type=`
- `POST /integrations/:id/events/webhook`
- `POST /integrations/:id/events/custom`

## Explicitly out of scope

- Third-party product connectors: GitHub webhooks, Jira, ServiceNow, PagerDuty
- Third-party identity providers: Google OAuth, GitHub OAuth, enterprise SSO/SCIM
- Monetization stack: Stripe subscriptions, Stripe webhooks, customer portal
- Microsoft Purview eDiscovery

## Realtime socket events (`/ws`)

Client -> server:

- `channel:join`
- `channel:leave`
- `message:send`
- `message:edit`
- `message:delete`
- `message:react`
- `thread:create`
- `thread:reply`
- `typing:start`

Server -> client:

- `message:created`
- `message:updated`
- `message:deleted`
- `message:reacted`
- `thread:created`
- `thread:reply`
- `typing:update`
