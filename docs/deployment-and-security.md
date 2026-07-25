# Deployment and Security

## Hosting

Use a Vite production build served from a real static host or CDN.

Do not use `vite preview` as a production server.

Use Next.js only when the surrounding product requires server features or a broader full-stack shell.

## Base path

Vite bakes the asset prefix into `dist/` at build time. Set it per target via
the `DEPLOY_BASE` environment variable (read in `vite.config.ts`):

| Target                                         | `DEPLOY_BASE`         | Serves at                              |
| ---------------------------------------------- | --------------------- | -------------------------------------- |
| GitHub Pages project site (default)            | _(unset)_             | `https://<user>.github.io/<repo>/`     |
| GitHub Pages with a custom domain (CNAME file) | `/`                   | `https://quest.example.com/`           |
| S3 + CloudFront + Route 53                     | `/`                   | `https://quest.example.com/`           |
| Any other subpath deployment                   | `'/<subpath>/'`       | `https://host/<subpath>/`              |

The default in `vite.config.ts` (`'/experient-quest/'`) targets the current
GitHub Pages repo. Anything served from the root **must** build with
`DEPLOY_BASE=/`, or asset URLs 404.

All code that references public assets must use `import.meta.env.BASE_URL` as
a prefix (see `src/game/characters/characters.ts`). Never hardcode a leading
`/assets/...` — it will break under a subpath deployment.

## Deployment targets

### GitHub Pages (current)

- Source: **GitHub Actions** (Settings → Pages → Source).
- Workflow: `.github/workflows/deploy.yml` runs on push to `main`, builds with
  the default base, and publishes `dist/`.
- `public/.nojekyll` prevents Jekyll from stripping `_`-prefixed files.
- Private repos require a paid GitHub plan for Pages.

To move GitHub Pages to a custom domain instead of a subpath:

1. Add a `CNAME` file to `public/` containing the apex or subdomain.
2. Set `DEPLOY_BASE=/` in the workflow's build step.
3. Point DNS at GitHub Pages per their custom-domain docs.

### S3 + CloudFront + Route 53

Build once with `DEPLOY_BASE=/ npm run build`, sync `dist/` to the bucket,
then invalidate CloudFront.

**Bucket setup**

- Private bucket + CloudFront **Origin Access Control** (preferred over the
  legacy "static website hosting" endpoint — OAC gives HTTPS, signed URLs if
  needed later, and blocks direct S3 access).
- Bucket policy grants `s3:GetObject` only to the CloudFront distribution.

**CloudFront distribution**

- Default root object: `index.html`.
- **SPA fallback**: add custom error responses mapping both `403` and `404`
  to `/index.html` with response code `200`. Without this, refreshing a deep
  link or hitting a mistyped path returns S3's XML error instead of the app.
  The app has no client-side routes today, but keep the fallback in place so
  future routing "just works."
- Compression: enable Gzip and Brotli.
- Viewer protocol policy: redirect HTTP → HTTPS.
- Certificate: ACM cert for the domain in `us-east-1` (CloudFront
  requirement).

**Route 53**

- Alias A/AAAA record for the domain → CloudFront distribution.

**Cache headers** — set at upload time (S3 metadata) so CloudFront and
browsers cache correctly:

| Path            | `Cache-Control`                       |
| --------------- | ------------------------------------- |
| `/index.html`   | `no-cache`                            |
| `/assets/*`     | `public, max-age=31536000, immutable` |
| `/favicon.svg`  | `public, max-age=86400`               |

Vite hashes asset filenames, so `/assets/*` is safe to freeze. `index.html`
must revalidate — otherwise CloudFront serves stale HTML pointing at deleted
asset hashes after a deploy.

**Content types** — S3 usually infers these correctly, but verify:

- `.glb` → `model/gltf-binary`
- `.gltf` → `model/gltf+json`
- `.ktx2` → `image/ktx2`
- `.wasm` → `application/wasm`

Wrong MIME on `.wasm` breaks Rapier physics silently in some browsers.

**Deploy sequence**

```bash
DEPLOY_BASE=/ npm run build
aws s3 sync dist/ s3://<bucket>/ --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html" --exclude "*.html"
aws s3 cp dist/index.html s3://<bucket>/index.html \
  --cache-control "no-cache"
aws cloudfront create-invalidation \
  --distribution-id <id> --paths "/index.html"
```

Only invalidate `/index.html` — hashed assets are new URLs, not overwrites.

## Caching

Use content-hashed file names.

Recommended policy:

- HTML: revalidate with `no-cache` or equivalent
- Hashed JS and CSS: `public, max-age=31536000, immutable`
- Hashed GLB, KTX2, image, audio, and video assets: `public, max-age=31536000, immutable`
- Mutable content manifests: short cache or revalidation

Never replace a file at the same immutable URL.

## Asset origins

Prefer same-origin assets or a single controlled CDN.

When remote origins are required:

- Configure CORS correctly
- Add exact origins to CSP
- Avoid arbitrary user-supplied asset URLs
- Self-host decoder and transcoder binaries where practical
- Test canvas screenshots and texture loading, since cross-origin media can taint canvas operations

## Content Security Policy

Start in Report-Only mode and inspect violations before enforcement.

Example baseline:

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://assets.example.com;
  media-src 'self' https://assets.example.com;
  connect-src 'self' https://api.example.com https://assets.example.com;
  worker-src 'self';
  frame-ancestors 'none';
  base-uri 'none';
```

Tighten this to the actual application. Do not cargo-cult origins or directives.

## Asset validation

Run glTF-Validator for every shipping GLB.

Also enforce:

- File-size limits
- Supported extensions
- Required metadata
- License/provenance records
- Texture dimension policy
- No hidden executable or unrelated files in asset directories

Validation is a structural gate, not a complete malware scan.

## Browser policy

Audio may not start until a user gesture. Build an explicit start or unmute interaction.

Do not request browser permissions that the experience does not need.

Avoid loading remote iframes into the game presentation unless there is a strong reason and the origin is reviewed.

## Release checks

Before deployment:

1. Build succeeds from a clean checkout.
2. Typecheck, lint, unit tests, and E2E smoke tests pass.
3. All asset URLs resolve from the deployed base path.
4. CSP Report-Only output is reviewed.
5. Static caching headers match file mutability.
6. The game works on a cold cache.
7. A rollback target exists.
8. The meeting content has a non-3D fallback or export when business-critical.

## Observability

Capture enough information to diagnose demo failures:

- Application version or commit
- Browser and device class
- Scene boot duration
- Asset load failures
- WebGL context loss
- Unhandled errors
- Quality profile selected

Do not collect unnecessary personal information from meeting attendees.
