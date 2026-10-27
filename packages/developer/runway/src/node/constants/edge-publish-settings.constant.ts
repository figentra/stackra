/**
 * Stackra file contract:
 * Purpose: `EDGE_PUBLISH_SETTINGS`, the data Runway's publish step and its canaries run with: where a product's built
 *          extension bundles sit and the manifest beside each, the uploader command and the object headers, the
 *          `host:` row defaults, the canary window and health thresholds, the shell compatibility build and the
 *          ops second-reviewer count.
 * Boundary: data only; `publishProduct`, `publishShell`, `canaryVerdict`, `promoteCanary`, `checkShellCompatibility`
 *           and `checkOpsReview` read it, and each request may override the values it names. No threshold or window
 *           is written anywhere else.
 * Runtime: node
 * Governing contract: ADR 0436 (decisions 4 and 10); ADR 0437 (the KV copy); app-shells 4.2, 5.3, 15 (point 7) and
 *                     16 (points 3, 4 and 7); owner decision D6 (canary: internal and demo scopes first, 24 h,
 *                     health-gated).
 */

/** How the publish step finds, uploads and points to bundles, and when a canary promotes. */
export const EDGE_PUBLISH_SETTINGS = Object.freeze({
  /** `stackra.bundleConfig`'s output root: one bundle per `<surface>/<version>/` folder below it. */
  bundleDir: "dist/bundles",
  /** The manifest the bundle build writes beside each bundle. */
  manifestFile: "bundle.manifest.json",
  /** The CLI that uploads to the asset store (R2) and writes Workers KV; its own login holds the credentials. */
  wrangler: "wrangler",
  /** Bundle file names are content-hashed and the folder is versioned, so every object is immutable. */
  cacheControl: "public, max-age=31536000, immutable",
  /** Content types by file extension; another extension is uploaded without one. */
  contentTypes: Object.freeze({
    ".js": "text/javascript",
    ".mjs": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".map": "application/json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".webp": "image/webp",
    ".woff2": "font/woff2",
  } as Readonly<Record<string, string>>),
  /** The status a platform `host:` row is written with. */
  hostStatus: "active",
  /** The sign-in realm of a platform host whose surface `realms` does not name. */
  defaultRealm: "tenant",
  /** Sign-in realm per surface key, when it is not `defaultRealm`. */
  realms: Object.freeze({} as Readonly<Record<string, string>>),
  /** Canary promotion (D6, app-shells 16.4): every value here must hold; a timer alone never promotes. */
  canary: Object.freeze({
    /** Hours the canary runs on the canary scopes before it may promote. */
    windowHours: 24,
    /** The highest error rate (errors / requests) the canary may show; above it the canary rolls back. */
    maxErrorRate: 0.01,
    /** Requests the canary must have served before its error rate counts, for a promotion or a rollback. */
    minRequests: 1000,
  }),
  /** The shell compatibility build (app-shells 15.7), run in each product checkout; `{importMap}` is replaced. */
  compatibility: Object.freeze({
    command: "pnpm",
    args: Object.freeze(["run", "build:bundles", "--", "--import-map", "{importMap}"]),
  }),
  /** Approvals besides the author an ops contribution needs before it publishes (app-shells 16.7). */
  opsReviewers: 1,
} as const);
