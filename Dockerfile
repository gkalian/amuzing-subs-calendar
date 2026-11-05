# --- Build stage: full deps, compile client and server ---
FROM node:26-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# --- Runtime stage: production deps + build output only ---
FROM node:26-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund \
 && npm cache clean --force

COPY --from=build /app/dist ./dist

# Non-root user and data dir (app files stay owned by root, read-only for the app)
RUN addgroup -S -g 1001 app \
 && adduser -S -D -H -u 1001 -G app app \
 && mkdir -p /data \
 && chown 1001:1001 /data
USER app

EXPOSE 8080
CMD ["node", "dist/server/index.js"]
