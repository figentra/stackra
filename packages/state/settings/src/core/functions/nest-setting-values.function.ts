/**
 * Stackra file contract:
 * Purpose: `nestSettingValues`, flat group paths as one object for a settings class's schema: a `<section>.<field>`
 *          path becomes a field of its section (one level deep).
 * Boundary: pure. Internal: not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 22: sections).
 */
import type { SettingValue } from "#contracts/index";

/**
 * The nested object of `values`.
 *
 * @example
 * nestSettingValues({ a: 1, "s.b": 2 }); // { a: 1, s: { b: 2 } }
 */
export function nestSettingValues(
  values: Readonly<Record<string, SettingValue>>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [path, value] of Object.entries(values)) {
    const dot = path.indexOf(".");
    if (dot === -1) {
      out[path] = value;
      continue;
    }
    const section = path.slice(0, dot);
    const current = out[section];
    const inner =
      typeof current === "object" && current !== null
        ? (current as Record<string, unknown>)
        : (out[section] = {} as Record<string, unknown>);
    inner[path.slice(dot + 1)] = value;
  }
  return out;
}
