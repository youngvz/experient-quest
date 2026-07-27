# Infrastructure

Terraform + a top-level `Makefile` provision and manage the multiplayer
server on AWS. Nothing here touches the game code — the client stays on
GitHub Pages, only the WebSocket server runs on EC2.

## One-time bootstrap (per AWS account)

You do this once. All subsequent work goes through `make tf-apply` /
`make start` / etc.

### 1. Create an EC2 key pair

Named `experient-mmo` in the console (or via CLI) and save the private
key to `~/.ssh/experient-mmo.pem`:

```sh
aws ec2 create-key-pair --key-name experient-mmo \
  --query 'KeyMaterial' --output text > ~/.ssh/experient-mmo.pem
chmod 600 ~/.ssh/experient-mmo.pem
```

The private key never enters Terraform state.

### 2. Populate `terraform.tfvars`

```sh
cp infra/terraform/terraform.tfvars.example infra/terraform/terraform.tfvars
# edit — set `my_ip` (curl ifconfig.me + /32) and `key_name`
```

### 3. Create the Terraform state bucket + lock table

The main workspace uses an S3 remote backend, but that bucket doesn't
exist yet. The bootstrap workspace creates it (its own state is local
and small — it just holds two resources).

```sh
make tf-bootstrap-init
make tf-bootstrap-apply
```

If you change the default bucket/table names in
`infra/terraform/bootstrap/main.tf`, update `infra/terraform/backend.tf`
to match.

### 4. Init the main workspace

```sh
make tf-init
```

Terraform will contact the S3 backend and set up its remote state.

## Everyday operations

```sh
make tf-plan            # preview changes
make tf-apply           # provision (or update) the EC2 + SG
make status             # instance state + public IP
make start              # boot the box for a demo
make ssh                # jump onto it
make logs               # tail docker compose logs over SSH
make deploy-server      # git pull + docker compose up --build
make stop               # back to $0/hour compute
make tf-destroy         # tear everything down
```

## Restart workflow (every demo session)

Once provisioned, the loop looks like:

```sh
make start              # ~30s, prints new public IP
make status             # confirm running + copy the IP
# → hit that IP with VITE_MMO_URL=ws://<ip>:8080
# ... demo ...
make stop               # $0/hr compute
```

What survives a stop/start:

- Instance id, EBS volume, Docker images, git clone, systemd unit
- The compose stack auto-starts on boot (systemd runs
  `docker compose up -d --build`, ~30–60s after `instance-running`)

What changes on every stop/start:

- **The public IP.** Auto-assigned IPs rotate; nothing else does. Point
  clients at the new address. Fix permanently by requesting an EIP
  quota bump and setting `create_eip = true` in tfvars.

What doesn't auto-happen:

- **No `git pull` at boot.** If code changed between sessions, run
  `make deploy-server` after `make start`.
- **Cloud-init only runs on first boot.** Manual bootstrap changes
  (buildx install, etc.) persist; they don't re-run on restart.

## Common failure modes

- **`make ssh` hangs.** Your ISP rotated your public IP; the SG rule
  is now stale. Refresh `my_ip` in `terraform.tfvars`:
  ```sh
  echo "$(curl -s ifconfig.me)/32"
  # edit tfvars → my_ip = "..."
  make tf-apply    # touches only the SG, ~10s
  ```

- **`experient-game` in a restart loop.** Get logs:
  ```sh
  make ssh
  sudo docker logs experient-game 2>&1 | tail -30
  ```
  Usually a code error (import path, missing dep). Fix locally, push,
  `make deploy-server`.

- **GitHub Pages clients can't connect.** `VITE_MMO_URL` in the repo's
  Actions Variables points at the old IP. Settings → Secrets and
  variables → Actions → Variables → update `VITE_MMO_URL` → re-run
  the deploy workflow.

- **Mixed-content error in the browser.** Pages serves over HTTPS;
  `ws://` connections from HTTPS pages are blocked by every browser.
  Either test from `http://localhost:5173` against the deployed
  server, or wait until DNS + Caddy + a real domain give you `wss://`.

- **EC2 marked `stopping` for >5 min.** Rare, but if a stop hangs,
  force-stop from the console. Nothing on disk is affected.

## What Terraform creates

- Security group (443, 80, 8080 open to the internet; 22 restricted to
  your `/32`)
- IAM role + instance profile with `AmazonSSMManagedInstanceCore` and
  `CloudWatchAgentServerPolicy` attached
- EC2 instance (Amazon Linux 2023, `t3.small` by default) with an
  encrypted 20 GB gp3 root volume, IMDSv2 required
- Elastic IP + association — **off** by default (`create_eip = false`
  in tfvars). Flip to `true` once your account's EIP quota allows it
  to get a stable public IP across stop/start.
- Route53 A-record — **off** until `create_dns=true` + you set
  `hosted_zone_id` + `mmo_hostname`

The EC2's user-data clones this repo to `/opt/experient-quest` and runs
`server/scripts/bootstrap.sh`, which installs Docker + the compose
plugin and writes a systemd unit that brings up `game` + `caddy` via
`server/docker-compose.yml`.

## What Terraform doesn't create

- **EC2 key pair** — created manually so the private key never lands in
  state.
- **ACM cert for WSS** — Caddy issues Let's Encrypt on the box directly
  once DNS resolves.
- **Route53 hosted zone** — bring your own domain; the module just
  writes an A-record into an existing zone.
- **Static site hosting** — the frontend stays on GitHub Pages. If we
  ever want CloudFront caching for GLBs, we add a `static-site` module
  later.

## IP-only phase

Until you own a domain and flip `create_dns=true`, hit the server
directly:

- `ws://<eip>:8080` (no TLS — only from `http://localhost` frontends,
  browsers block mixed content from `https://` origins)
- Set `VITE_MMO_URL=ws://<eip>:8080` when running the client locally
  against the deployed server

Once DNS is live and Caddy issues its cert, switch to
`wss://mmo.<domain>/game`.

## Terraform state

- Bucket: `experient-tf-state-392821800047` (versioned, encrypted,
  public access blocked)
- Lock table: `experient-tf-locks` (DynamoDB, pay-per-request)

Both live in `us-east-1` regardless of workload region.

## Costs at rest

When the EC2 is `stopped`:

- EBS gp3 root volume: ~$1.60/mo (20 GB × $0.08)
- Elastic IP (attached-but-idle): $0 while attached to a stopped
  instance in the same account, $0.005/hr if unattached
- S3 state + DynamoDB lock: negligible (pennies)

When the EC2 is `running`:

- t3.small on-demand: ~$0.021/hr ≈ $0.50/day of active demo time
- Data transfer out: first 100 GB free tier per month; snapshots
  at 50 CCU × 20 KB/s × 3600s ≈ 3.6 GB/hour, so a two-hour demo is
  well within free tier
