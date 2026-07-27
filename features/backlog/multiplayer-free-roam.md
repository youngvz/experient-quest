---
id: multiplayer-free-roam
status: backlog
created: 2026-07-27
owner: unassigned
---

# Multiplayer free-roam (≤50 CCU, self-hosted AWS)

## Why

Today the game is single-player: `<Player>` is hardcoded to
`CHARACTERS.youngvz` (`src/game/scene/Player.tsx:47`), all state lives in
one Zustand store, and there is no networking layer. To make the office a
shared space where up to ~50 concurrent players can free-roam and see each
other move, we need a small, dedicated network layer plus a character
picker on entry.

Keeping this **ephemeral** (no accounts, no persisted progress) and
**self-hosted on AWS** (company account, free-tier friendly) is the
cheapest path to a real multiplayer prototype without dragging in an auth
provider, a database, or a managed realtime service. Quest, interaction,
and HUD state stays entirely client-local — the only shared state is
"who's here, where are they, what are they doing" — so the server
footprint is tiny.

## Scope

### Client (React / R3F)

- New `src/game/state/networkStore.ts` (Zustand slice) holding
  `selfName`, `selfCharacterId`, `selfSessionId`, `connectionStatus`,
  and `remotePlayers: Map<sessionId, RemotePlayerSnapshot>`. Kept
  **separate** from `gameStore.ts` so quest/HUD state stays untouched.
  `remotePlayers` holds *interpolation targets*, not per-frame state —
  reads happen through refs inside `useFrame`, never through
  React re-renders.
- New `src/components/CharacterSelect/` DOM overlay that gates
  `<GameCanvas>` until the player enters a name and picks one of the 8
  characters in `src/game/characters/characters.ts:14-63` (`portraitUrl`
  is already authored for each). On submit → set identity and connect.
- Parameterize `<Player>` (`src/game/scene/Player.tsx:47`) to read the
  chosen character from `networkStore` instead of hardcoding `youngvz`.
  Everything else about the controller (dynamic RigidBody, `setLinvel`,
  clip weight-blend) stays exactly as-is.
- New `src/game/scene/RemotePlayer.tsx` — adapts the
  `Employee.tsx:32-93` GLB-load-and-fit pattern (via `useGLTF` +
  `SkeletonUtils.clone`, height auto-fit, skinned-mesh frustum-cull
  fix). Differences vs `Employee`: **kinematic** RigidBody
  (`type="kinematicPosition"`), a `useFrame` interpolation loop that
  lerps toward the latest snapshot with a ~100ms delay buffer, and
  multi-clip crossfading matching `Player.tsx:529-555` (idle / walk /
  run / roll / wave). Optional floating name label via drei `<Html>` or
  a `<Sprite>` billboard.
- New `src/game/scene/RemotePlayers.tsx` — collection that mounts one
  `<RemotePlayer>` per remote session id, sibling of `<Player>` inside
  the single `<Physics>` world at `OfficeWorld.tsx:77` / `:155`. Only
  re-renders when the *set* of session ids changes, not on every
  snapshot.
- New `src/game/net/NetworkClient.ts` — plain class outside the React
  tree. Opens `wss://.../game`, sends `hello { name, characterId }`,
  publishes local transform 20×/sec (sampled from a getter injected by
  `Player.tsx`), and writes inbound snapshots into `networkStore` via
  `applySnapshot`. Auto-reconnect with exponential backoff.
- Preload every character GLB in `OfficeWorld.tsx:66-74`
  (`useGLTF.preload`). Today's list omits `logan`; multiplayer needs
  all 8.

### Server (new `server/` folder, containerized)

- Node.js 20 LTS + `ws` + `@msgpack/msgpack`. ~200 lines total, shipped
  as a Docker image built from `server/Dockerfile`.
- Message protocol (msgpack-encoded):
  - **Client → Server**: `hello { name, characterId }`,
    `input { x, z, yaw, vx, vz, action, actionRemaining, activeZone }`
    at 20Hz.
  - **Server → Client**: `welcome { sessionId, tickRate }`,
    `nameRejected { reason }`, `snapshot { players[] }` at 20Hz filtered
    by area-of-interest, `playerLeft { id }`.
- Responsibilities:
  1. Session management: assign session ids, enforce case-insensitive
     name uniqueness, track connected sockets.
  2. Light anti-cheat: uplink rate clamp, speed sanity check
     (`sqrt(vx² + vz²) ≤ 8` — a bit above
     `STANDING_ROLL_SPEED = 6` from `Player.tsx:73`), reject teleport-
     sized position jumps.
  3. AOI broadcast: every 50ms, for each client, gather peers in the
     same/adjacent zone and send one snapshot. Reuses the existing
     zone system.
  4. **No physics simulation.** Clients are authoritative on their own
     position within the sanity bounds. Physics stays trusted-client.
- Layout:
  ```
  server/
    src/
      index.ts           # boot: ws.Server, message router, tick loop
      session.ts         # Session/PlayerState classes
      protocol.ts        # msgpack encode/decode + wire types
      aoi.ts             # zone adjacency + visible-peers filter
    package.json         # ws, @msgpack/msgpack, tsx (dev), pino (logs)
    Dockerfile           # multi-stage (build → node:20-alpine runtime)
    docker-compose.yml   # game-server + caddy TLS proxy stack
    Caddyfile            # reverse-proxies wss://…/game → ws://game:8080
    Makefile             # local docker-build / docker-run / docker-down
    scripts/
      bootstrap.sh       # idempotent EC2 first-boot Docker install
  ```
- **Shared types**: `shared/protocol-types.ts` referenced by both
  `server/` and `src/game/net/` so wire messages can't drift.

### AWS infrastructure — Terraform + Docker + Makefile (no click-ops)

Everything below is authored as code so an environment can be created,
torn down, or rebuilt with a single `terraform apply`. The only one-time
console steps are creating the Terraform IAM user and the SSH key pair.

- **Terraform** (`infra/terraform/`, modular):
  - `modules/network/` — default-VPC lookup + one security group
    (443 WSS, 80 ACME, 22 SSH restricted to a `my_ip` `/32`).
  - `modules/compute/` — EC2 (`t3.small` default, `t3.micro` for free
    tier), Elastic IP, IAM instance profile (read-only SSM +
    CloudWatch Logs write), `user_data` pointing at
    `user-data/cloud-init.sh`. Tagged `Name = experient-mmo-server`
    so the Makefile can look it up without hardcoding an id.
  - `modules/dns/` — Route53 A-record for `mmo.<domain>` → EIP.
    Gated by `create_dns` bool so a first apply can proceed on an IP
    before you own a domain.
  - `modules/static-site/` — S3 (block public, versioned) + CloudFront
    with OAC + ACM cert in `us-east-1` for the web frontend.
  - Local Terraform state for solo MVP; documented (not scaffolded)
    S3 + DynamoDB backend for when a second dev joins.
- **`user-data/cloud-init.sh`** — runs at first boot, idempotent so it
  can also be re-run by hand. Installs Docker + compose plugin (Amazon
  Linux 2023 via `dnf`), clones the repo to `/opt/experient-quest`,
  writes `/etc/systemd/system/experient-server.service` that calls
  `docker compose up -d --build`, and `systemctl enable --now`s it.
- **Server image**: `server/Dockerfile` is a multi-stage build
  (`node:20-alpine` builder runs `tsc`, `node:20-alpine` runtime runs
  `node dist/index.js`).
- **Compose stack** (`server/docker-compose.yml`): two services —
  `game` (Node process on port 8080) and `caddy` (`caddy:2-alpine`
  handling TLS termination + WSS reverse proxy). Persistent
  `caddy_data` volume so Let's Encrypt certs survive restarts and
  renewals happen automatically.
- **Top-level `Makefile`** wraps every day-to-day operation. Reads
  `REGION` from env and looks up the EC2 by `Name` tag:
  - `make tf-init / tf-plan / tf-apply / tf-destroy` — Terraform lifecycle
  - `make start / stop / status` — wraps `aws ec2 start-instances`
    / `stop-instances` / `describe-instances`
  - `make ssh / logs` — SSH into the EC2, tail `docker compose logs`
  - `make deploy-server` — SSH pull + `docker compose up -d --build`
  - `make deploy-web` — Vite build → S3 sync → CloudFront invalidation
  - `make docker-build / docker-run / docker-down` — local prod-like dev
- **Manual on/off (no cron, no Lambda).** By decision, the EC2 sits
  `stopped` by default (~$1/mo for EBS + Elastic IP, $0 compute). Demo
  workflow is `make start` → demo → `make stop`. Adding a scheduled
  start/stop later is a ~30-line Terraform addition (one
  `aws_scheduler_schedule` for each direction) gated behind a
  `schedule_enabled` variable — deferred, not scaffolded.
- **Static frontend**: same S3 (`experient-quest-web`) + CloudFront
  distribution as before, created by `modules/static-site/`. `npm run
  build && aws s3 sync dist/ s3://…` is one `make deploy-web` target.
- **Security group**: 443 (WSS) + 80 (ACME) + 22 (SSH from your `my_ip`
  `/32`).
- **What Terraform does NOT create**:
  - ACM for the WSS endpoint (Caddy issues Let's Encrypt on the box).
  - SSH key pair (created once outside Terraform so the private key
    never lands in state; `key_name` variable references it).
  - The Terraform IAM user itself (bootstrap step).
- **Not needed at 50 CCU**: ALB, ECS, Lambda, RDS/DynamoDB,
  ElastiCache. Introduce those only if we ever shard across multiple
  EC2s (ALB + Redis Pub/Sub for cross-instance broadcast).

## Non-goals

- **No accounts, no auth, no persistence.** Ephemeral sessions only;
  disconnect wipes the player. Quest progress stays in-memory /
  localStorage as today.
- **No server-side physics or authoritative movement.** Clients drive
  their own position; server clamps speed and rejects teleport-jumps
  but does not simulate.
- **No voice chat, text chat, emotes beyond wave, or friends list.**
- **No WebRTC / SFU.** Plain `wss://` is enough at this scale.
- **No load balancer, no multi-region, no auto-scaling.** Single Node
  process, single EC2, one region.
- **No shared quest state across players.** Each player still runs
  through their own interactions and quest progression — this is a
  presentation experience, not a co-op quest system.
- **No mid-game character swap.** Character is chosen once at spawn
  and locked for the session.

## Acceptance criteria

- Two browser tabs on `http://localhost:5173` can each enter a
  different name + character, spawn into the office, and see the other
  as a smoothly-animated avatar (idle → walk → run threshold correct,
  facing correct, roll and wave one-shots replicated). Latency feels
  acceptable on same-machine local dev.
- The 8 character GLBs in `src/game/characters/characters.ts` all work
  as both the local player and a remote avatar. `logan` is added to
  the `useGLTF.preload` list.
- Closing a tab causes the other client to unmount that avatar within
  ~1s (server sends `playerLeft`).
- Server passes a load-test script that opens 50 headless WebSocket
  clients firing synthetic 20Hz `input` frames: server CPU stays
  <20% on `t3.small`, downlink per client <100 KB/s, no
  `ws.bufferedAmount` growth.
- New Playwright spec (`tests/e2e/multiplayer.spec.ts`) boots the
  local server in `beforeAll`, launches two browser contexts, and
  asserts each context renders the other's avatar within 2s.
- `npm run build`, `npm run lint`, `npm run test`, and
  `npm run test:e2e` all pass.
- Existing single-player HUD, quest progression, and interaction
  prompts behave identically to today for the local player.
  `gameStore.ts` is unchanged.
- Deployed to a real EC2 behind Caddy TLS; two devices on different
  networks can join and see each other. `make logs` shows no error
  spam; Caddy log confirms cert issuance.
- Terraform apply on a fresh workspace succeeds top-to-bottom
  (`make tf-init && make tf-apply`) and `make tf-destroy` cleans up
  the environment without manual console follow-up. Re-applying
  reproduces the environment from scratch.
- `make start` boots the EC2 and reaches "WSS reachable" within ~60s
  (systemd re-runs `docker compose up -d --build` at instance start).
  `make stop` transitions the instance to `stopped` and compute
  billing pauses.

## Implementation notes

- **Infra is code, not clicks.** `terraform apply` creates every AWS
  resource; the Makefile wraps every day-to-day command. The one-time
  console work is: create a Terraform IAM user, create an SSH key
  pair, populate `infra/terraform/terraform.tfvars`. Documented in
  a small `infra/README.md` alongside the modules.
- **Systemd → Docker Compose, not bare Node.** The EC2's systemd unit
  runs `docker compose up -d --build`; we don't hand-install Node,
  nvm, or Caddy on the host. That keeps the box interchangeable
  (`terraform taint` + `apply` reproduces it) and lets local dev use
  the same image via `make docker-run`.
- **Reuse `Employee.tsx`.** Its GLB-load / height-fit / skinned-mesh
  frustum-cull fix is exactly what a remote avatar needs. Only add
  what's different (kinematic body, interpolation loop, multi-clip
  crossfade, name label).
- **Snapshot writes bypass React.** The snapshot handler mutates the
  `remotePlayers` Map through Zustand's `set` but consumers read via
  `useRef` inside `useFrame`. Only the collection component
  subscribes to *keys* of the Map, so React re-renders only on
  join/leave, not on every tick. This matches the CLAUDE.md rule
  against per-frame React re-rendering.
- **StrictMode gotcha.** The same `useEffect` cleanup pattern from
  `InteractionManager` applies to `NetworkClient` — open the socket
  and register listeners in one effect whose cleanup fully disposes
  them. Otherwise dev-mode's double-mount leaves an orphaned socket.
- **`Physics timeStep="vary"`** at `OfficeWorld.tsx:77` is fine —
  we're not attempting deterministic lockstep. Clients own their own
  sim.
- **AOI reuses zones.** The client already tracks `activeZone`
  (`gameStore.ts:9`, `:201-216`); piggyback on the same zone-graph on
  the server to filter which peers each client hears about. Corridor
  zones bridge branch rooms, which matches "same or adjacent zone"
  naturally.
- **Naming.** `networkStore.ts` (not `multiplayerStore`) mirrors the
  existing `gameStore.ts` file naming. Zone/session ids stay
  kebab-case per CLAUDE.md's conventions.
- **Wire format.** msgpack over binary WS frames. At 20Hz × 50 players
  a snapshot is well under 2 KB; downstream stays comfortably below
  100 KB/s per client. JSON would work too but doubles the byte cost.
- **CI/CD (optional MVP add-on).** GitHub Actions +
  `aws-actions/configure-aws-credentials`: one workflow builds and
  syncs the frontend to S3, another SSHes the EC2 and runs
  `git pull && npm ci && npm run build && systemctl restart
  experient-server`.
- **Docs to update on landing**: `docs/architecture.md` (new
  "Multiplayer" section), `CLAUDE.md` "Exists today" list (add
  `src/game/net/` + network store + remote-player components + the
  new `infra/terraform/` and top-level `Makefile`), and a new
  `infra/README.md` covering the one-time bootstrap. Potentially
  `docs/deployment-and-security.md` for the EC2 + Caddy + Terraform
  bits.

## Rough estimate

- Client wiring: character-select modal + `networkStore` +
  `NetworkClient` + `RemotePlayer` + `RemotePlayers`: 1–2 focused
  passes.
- Server + Docker/Compose/Caddyfile/Makefile: ~200 lines of TS + the
  packaging bits, one afternoon.
- Terraform (network / compute / dns / static-site modules +
  cloud-init.sh + top-level Makefile): half a day to a full day for
  someone comfortable with the AWS provider.
- First `terraform apply` + Route53 wire-up + Caddy cert issuance:
  1–2 hours.
- Load test + Playwright spec: half a day.

Bundle across two PRs — one for client + shared types, one for
`server/` + `infra/terraform/` + `Makefile`. The client can ship
first against a local `make docker-run` server before the AWS side
lands.

## Related

- Plan doc:
  `~/.claude/plans/knowing-my-current-architecture-delightful-flame.md`
  (2026-07-26, updated 2026-07-27) — full architecture rationale,
  protocol details, Terraform module breakdown, Docker/Compose
  configs, Makefile targets, and verification steps.
- `src/game/scene/Player.tsx` — dynamic RigidBody, `setLinvel`
  movement, multi-clip weight-blend animation (lines
  47, 484, 529-555). Also `STANDING_ROLL_SPEED = 6` at line 73.
- `src/game/scene/Employee.tsx` — canonical `useGLTF` +
  `SkeletonUtils.clone` + auto-fit pattern reused by `RemotePlayer`
  (lines 32-93).
- `src/game/scene/OfficeWorld.tsx` — single `<Physics>` world at
  line 77, `<Player>` mount at line 155, `useGLTF.preload` list at
  lines 66-74 (`logan` missing).
- `src/game/state/gameStore.ts` — quest / zone / HUD state stays
  untouched; new `networkStore.ts` sits alongside it.
- `src/game/characters/characters.ts:14-63` — the 8-character
  registry that powers the character-select modal.
- `src/game/interactions/InteractionManager.ts` — stays client-local;
  same StrictMode-cleanup gotcha applies to `NetworkClient`.
