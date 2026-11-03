/**
 * Stackra file contract:
 * Purpose: `diffWorkerSettings(rendered, live)`, the settings of a rendered wrangler config that Cloudflare reports
 *          differently, as rows.
 * Boundary: pure. Only settings Cloudflare's API reports are compared: `upload_source_maps`, `keep_vars`, `cache`,
 *           `observability.issues` and `observability.redact_query_string` are deploy-time flags it does not return.
 *           Code facts of the member's wrangler.jsonc (name, bindings, routes) are not compared.
 * Runtime: isomorphic
 * Governing contract: ADR 0519 (decision 7); STA-1992.
 */
import type { DriftRow } from "#core/types/drift-row.type";

/** The rendered keys Cloudflare's API does not report. */
const UNREPORTED = new Set([
  "upload_source_maps",
  "keep_vars",
  "cache.enabled",
  "observability.issues.enabled",
  "observability.redact_query_string",
]);

/** The keys the renderer writes, which are the only ones compared. */
const OPERATIONAL =
  /^(compatibility_|workers_dev|preview_urls|observability|limits|cache|upload_|keep_)/;

const isObject = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && !Array.isArray(x);

/** Each scalar (or array) leaf of `value` under its dotted path. */
function leaves(value: unknown, path = ""): [string, unknown][] {
  if (!isObject(value)) return [[path, value]];
  return Object.entries(value).flatMap(([key, child]) =>
    leaves(child, path === "" ? key : `${path}.${key}`),
  );
}

/** Arrays compare as sets; the rest as JSON. */
const show = (value: unknown): string =>
  value === undefined ? "<unset>" : JSON.stringify(Array.isArray(value) ? value.toSorted() : value);

/**
 * The differences.
 *
 * @example
 * diffWorkerSettings({ workers_dev: false }, { workers_dev: true });
 * // [{ key: "workers_dev", rendered: "false", live: "true" }]
 */
export function diffWorkerSettings(
  rendered: Readonly<Record<string, unknown>>,
  live: Readonly<Record<string, unknown>>,
): DriftRow[] {
  const liveLeaves = new Map(leaves(live));
  return leaves(rendered)
    .filter(([key]) => OPERATIONAL.test(key) && !UNREPORTED.has(key))
    .map(([key, value]) => ({ key, rendered: show(value), live: show(liveLeaves.get(key)) }))
    .filter((row) => row.rendered !== row.live);
}
