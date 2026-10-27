<!-- Purpose: what the turbo-cache folder of @stackra/infra-cloudflare declares and how a stack uses it. Boundary: folder documentation only. Runtime: docs. Governing contract: ADR 0026, ADR 0171 (decision 6), ADR 0289 (decision 2). -->

# `src/node/turbo-cache/`

The Cloudflare resources of the Turborepo remote cache (ADR 0026): `turboCache(args)` declares

- the R2 bucket (`bucket`, `turbo-cache` in the stack config) through `r2Bucket`;
- its lifecycle rule deleting objects after `expireDays` (7: turbo's `cacheMaxAge` and the Worker's
  `TURBO_CACHE_TTL_SECONDS`);
- with `domain`, a Workers Custom Domain putting the `stackra-turbo-cache` Worker (`workers/turbo-cache`) on that host.
  No ADR names the host, so it is a stack setting.

```ts
// figentra/infra, cloudflare/index.ts
import { turboCache } from "@stackra/infra-cloudflare/node";

turboCache({
  accountId,
  bucket: "turbo-cache",
  expireDays: 7,
  script: "stackra-turbo-cache",
  domain: { hostname: "<cache host>", zoneId: zones["figentra.com"].zone.id },
});
```

Use this or the core stack's config (`buckets.turbo-cache.expireDays` plus a zone `workers` entry), never both: they
would declare the same bucket and host twice.

The Worker script, its binding, settings and token secret are wrangler's; nothing here reads a secret.

Not exported from `./node` yet: the entry barrel (`src/node/index.ts`) is shared, so the export is an integration
step (until then, the core stack's config path covers the same resources).
