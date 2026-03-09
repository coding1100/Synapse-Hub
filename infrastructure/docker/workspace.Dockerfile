FROM node:20-alpine

WORKDIR /app

ENV npm_config_update_notifier=false \
    npm_config_fund=false \
    npm_config_audit=false \
    npm_config_fetch_retries=5 \
    npm_config_fetch_retry_factor=2 \
    npm_config_fetch_retry_mintimeout=10000 \
    npm_config_fetch_retry_maxtimeout=120000 \
    npm_config_fetch_timeout=120000 \
    npm_config_registry=https://registry.npmjs.org/

COPY package*.json ./
COPY tsconfig*.json ./
COPY apps ./apps
COPY services ./services
COPY packages ./packages

RUN set -eux; \
    attempt=1; \
    max=3; \
    while [ "$attempt" -le "$max" ]; do \
      npm ci --prefer-offline --no-fund --no-audit && break; \
      if [ "$attempt" -eq "$max" ]; then \
        echo "npm ci failed after ${max} attempts"; \
        exit 1; \
      fi; \
      echo "npm ci failed (attempt ${attempt}/${max}), retrying..."; \
      sleep $((attempt * 10)); \
      attempt=$((attempt + 1)); \
    done

RUN npm run prisma:generate --workspace @synapsehub/shared

ARG BUILD_WORKSPACE
RUN npm run build --workspace ${BUILD_WORKSPACE}

ENV WORKSPACE_NAME=${BUILD_WORKSPACE}

CMD ["sh", "-c", "npm run start --workspace ${WORKSPACE_NAME}"]
