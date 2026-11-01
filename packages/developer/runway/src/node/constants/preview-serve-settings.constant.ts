/**
 * Stackra file contract:
 * Purpose: `PREVIEW_SERVE_SETTINGS`, the defaults of the local edge (`previewServe`): the local KV file, the address
 *          and port, the asset path the local origin serves, the API path prefixes it proxies, the locales of the
 *          startup record, and the startup record's element id, as the edge Worker writes it.
 * Boundary: data only; a `PreviewServeRequest` overrides the address, port, file, prefixes and locales.
 * Runtime: node
 * Governing contract: ADR 0437 (decisions 2 and 3); STA-1676.
 */

/** Local edge defaults. */
export const PREVIEW_SERVE_SETTINGS = Object.freeze({
  /** The local KV copy, relative to the working folder. */
  kvFile: ".stackra/preview/edge-kv.json",
  /** Loopback only: the server is never reachable from another machine. */
  host: "127.0.0.1",
  /** The port, the Vite preview default. */
  port: 4173,
  /** The path the local origin serves the asset store under (bundles and shells). */
  assetsPath: "/assets",
  /** The path prefixes proxied to the API upstream; the edge Worker reserves `/api`. */
  apiPrefixes: ["/api"],
  /** The startup record's locales when the request names none, as the edge Worker's default. */
  locales: { default: "en", enabled: ["en"] },
  /** The element id the shell reads the startup record from. */
  startupRecordId: "stackra-startup",
} as const);
