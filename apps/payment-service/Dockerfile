# syntax=docker/dockerfile:1

# Stage 1: Dependencies and Build
FROM node:20-alpine AS builder

WORKDIR /workspace

# Copy package files and NX config
COPY package.json package-lock.json nx.json tsconfig.base.json ./

# Install all dependencies (including dev deps for build)
RUN npm ci

# Copy workspace files
COPY apps ./apps
COPY libs ./libs
COPY jest.preset.js ./jest.preset.js

# Build the service with NX (includes shared libs)
RUN npx nx build payment-service --configuration=production

# Stage 2: Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application from builder
COPY --from=builder /workspace/dist/apps/payment-service ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 50059 3012

CMD ["node", "dist/main.js"]
