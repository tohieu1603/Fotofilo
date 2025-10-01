# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /workspace

COPY package.json package-lock.json nx.json tsconfig.base.json ./
RUN npm ci

COPY apps ./apps
COPY libs ./libs
COPY jest.preset.js ./jest.preset.js

RUN npx nx build api-gateway --configuration=production


FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=deps /workspace/dist/apps/api-gateway ./dist

EXPOSE 3000
CMD ["node", "dist/main.js"]