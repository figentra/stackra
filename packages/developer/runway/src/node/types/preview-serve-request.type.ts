/**
 * Stackra file contract:
 * Purpose: `PreviewServeRequest`, one local edge run: the built product and the surface to serve, the address and
 *          port, the API upstream and the path prefixes proxied to it, the region and locales of the startup record,
 *          and the local KV copy.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0437; STA-1676.
 */
import type { LocalEdgeKvDriver } from "#node/drivers/local-edge-kv.driver";

/** One local edge run. */
export type PreviewServeRequest = {
  /** The product repository, holding `dist/product/build.json`, the bundles and the line checkouts from `buildProduct`. */
  readonly repository: string;
  /** The web surface to serve, `console`. */
  readonly surface: string;
  /** The port; 4173 when absent, 0 for any free port. */
  readonly port?: number;
  /** The address; loopback (`127.0.0.1`) when absent. */
  readonly host?: string;
  /** The API upstream the prefixes are proxied to (`http://127.0.0.1:4000`); without one they answer 503, as the edge does. */
  readonly api?: string;
  /** The path prefixes proxied to `api`; `/api` when absent. */
  readonly apiPrefixes?: readonly string[];
  /** The home region the startup record names. */
  readonly region?: string;
  /** The startup record's locales; English only when absent, as the edge's default. */
  readonly locales?: { readonly default: string; readonly enabled: readonly string[] };
  /** The local KV copy; `.stackra/preview/edge-kv.json` under `repository` when absent. */
  readonly kv?: LocalEdgeKvDriver;
};
