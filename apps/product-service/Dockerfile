# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /workspace

# Install dependencies
COPY package.json package-lock.json nx.json tsconfig.base.json ./
RUN npm ci

# Copy source
COPY apps ./apps
COPY libs ./libs
COPY jest.preset.js ./jest.preset.js

# Build the service
RUN npx nx build product-service --configuration=production


FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy compiled output
COPY --from=deps /workspace/dist/apps/product-service ./dist

EXPOSE 3001 50051
CMD ["node", "dist/main.js"]