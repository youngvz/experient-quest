# Deployment and Security

## Hosting

Use a Vite production build served from a real static host or CDN.

Do not use `vite preview` as a production server.

Use Next.js only when the surrounding product requires server features or a broader full-stack shell.

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
