# Build context is the repo root (see docker-compose.yml) so that
# `shared/` is available as a sibling of `server/`. Multi-stage build:
# the runtime image only carries the compiled JS and prod deps.

# --- build stage ---
FROM node:20-alpine AS build
WORKDIR /app

# Install with a clean, reproducible cache: package files first so
# `npm ci` layer-caches when only source changes.
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm ci

# Source. `shared/` lives one level above `server/` in the repo layout,
# which matches the tsconfig rootDir configuration.
COPY server/tsconfig.json ./server/
COPY server/src ./server/src
COPY shared ./shared

RUN cd server && npm run build

# --- runtime stage ---
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Only prod deps in the final image.
COPY server/package.json server/package-lock.json* ./
RUN npm ci --omit=dev

# Emitted layout is dist/server/src/index.js + dist/shared/*.js —
# preserve it so relative imports resolve.
COPY --from=build /app/server/dist ./dist

EXPOSE 8080
ENV PORT=8080
ENV LOG_LEVEL=info

# Use a non-root user for the runtime process.
USER node

CMD ["node", "dist/server/src/index.js"]
