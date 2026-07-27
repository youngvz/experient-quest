# Server-scoped Makefile. The top-level Makefile (added with the
# Terraform PR) will wrap AWS lifecycle (make start / stop / ssh / logs
# / deploy-server / deploy-web). These targets stay local — build the
# TypeScript, run the Node process, or drive docker compose.
#
# Run from `server/` (or `make -C server <target>` from the repo root).

.PHONY: dev build start typecheck clean \
        docker-build docker-run docker-down docker-logs

# ---- Local Node ----

# Watch-mode dev server. Uses tsx so no dist/ churn during iteration.
dev:
	npm run dev

# One-shot type check without emit.
typecheck:
	npm run typecheck

# Compile TypeScript → dist/.
build:
	npm run build

# Run the compiled server locally (assumes `make build` first).
start:
	npm start

clean:
	rm -rf dist node_modules

# ---- Docker Compose (prod-like local stack) ----

# Build both images (game + caddy pull). Context is the repo root, set
# in docker-compose.yml, so `shared/` is included in the build.
docker-build:
	docker compose build

# Bring up game + caddy. `MMO_HOSTNAME=localhost` uses Caddy's internal
# CA so TLS works against 127.0.0.1 without owning a domain.
docker-run:
	MMO_HOSTNAME=localhost docker compose up --build

# Detached variant for CI / longer sessions.
docker-run-d:
	MMO_HOSTNAME=localhost docker compose up --build -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f --tail=200
