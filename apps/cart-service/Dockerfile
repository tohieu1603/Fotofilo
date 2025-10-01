
FROM node:20-alpine AS deps
WORKDIR /workspace

COPY package.json package-lock.json nx.json tsconfig.base.json ./
RUN npm ci

COPY apps ./apps
COPY libs ./libs
COPY jest.preset.js ./jest.preset.js

RUN npx nx build cart-service --configuration=production

FROM node:20-alpine as runner 
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=deps /workspace/dist/apps/cart-service ./dist

EXPOSE 50053
CMD ["node", "dist/main.js"]