FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY apps ./apps
COPY services ./services
COPY packages ./packages

RUN npm ci

RUN npm run prisma:generate --workspace @synapsehub/shared

ARG BUILD_WORKSPACE
RUN npm run build --workspace ${BUILD_WORKSPACE}

ENV WORKSPACE_NAME=${BUILD_WORKSPACE}

CMD ["sh", "-c", "npm run start --workspace ${WORKSPACE_NAME}"]
