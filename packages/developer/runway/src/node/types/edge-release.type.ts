/**
 * Stackra file contract:
 * Purpose: `EdgeRelease`, the value of a `release:<product>:<surface>` row: the bundle version, its entry URL, the
 *          folder URL, the shell line it targets and the absolute URLs the Worker preloads and links.
 * Boundary: type only; `publishProduct` and `promoteCanary` write it as JSON. Public data only (the bundle URLs).
 * Runtime: node
 * Governing contract: ADR 0437 (the KV copy); app-shells 5.1 (step 5), 5.3 and 15 (point 8: modulepreload).
 */

/** The bundle a surface serves. */
export type EdgeRelease = {
  /** The bundle version. */
  readonly version: string;
  /** The entry module's URL. */
  readonly url: string;
  /** The bundle folder's URL, ending in `/`. */
  readonly base: string;
  /** The shell line the bundle targets, `<surface>@<major>`. */
  readonly targets: string;
  /** The URLs the Worker emits `modulepreload` for, in load order. */
  readonly modulepreload: readonly string[];
  /** The stylesheet URLs. */
  readonly css: readonly string[];
};
