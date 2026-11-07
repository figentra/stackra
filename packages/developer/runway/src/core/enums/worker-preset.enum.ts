/**
 * Stackra file contract:
 * Purpose: `WorkerPreset`, the named bundles of Worker settings a `targets.cloudflare-workers` member picks from:
 *          a public site, an API, an internal tool, a cache and the edge.
 * Boundary: an `Enum.of` value plus the type of the same name. What each preset sets is `WORKER_PRESETS`.
 * Runtime: isomorphic
 * Governing contract: ADR 0519 (decision 2), ADR 0231 (kebab-case codes), ADR 0128 (`Enum.of`).
 */
import { Enum } from "@stackra/contracts";

/** One case per preset a Worker member can name. */
export const WorkerPreset = Enum.of({
  /** A public static or server-rendered site. */
  PublicSite: "public-site",
  /** A programmatic API. */
  Api: "api",
  /** A tool behind Access, never public. */
  InternalTool: "internal-tool",
  /** A cache or storage front. */
  Cache: "cache",
  /** The edge in front of a product. */
  Edge: "edge",
});

/** One of the codes above. */
export type WorkerPreset = Enum.Value<typeof WorkerPreset>;
