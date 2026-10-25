/**
 * Stackra file contract:
 * Purpose: `panels(definition)`, what gen calls in `#stackra/panels`: the app's panels as typed constants
 *          (`Panels.Admin`), each with its derived key, its mount path and the area it hosts.
 * Boundary: pure; returns frozen refs. Packages and services name an area, never a panel.
 * Runtime: isomorphic
 * Governing contract: ADR 0164 (decision 3); ADR 0082 (API areas); ADR 0294 (decision 20).
 */
import { ApiArea, Enum } from "@stackra/contracts";

import type { PanelRef } from "#core/types/panel-ref.type";

/** A panel key. */
const KEY = /^[a-z][a-z0-9_]*$/;

/**
 * The panel refs of `definition`, frozen.
 *
 * @throws RangeError when a key is not snake_case, a path does not start with `/` or an area is not an `ApiArea`.
 * @example
 * export const Panels = panels({
 *   Admin: { key: "admin", path: "/", area: ApiArea.Admin },
 * } as const);
 */
export function panels<const D extends Readonly<Record<string, PanelRef>>>(definition: D): D {
  const areas: readonly string[] = Enum.values(ApiArea);
  const out: Record<string, PanelRef> = {};
  for (const [name, panel] of Object.entries(definition)) {
    if (!KEY.test(panel.key)) throw new RangeError(`panels: ${name} has the key "${panel.key}"`);
    if (!panel.path.startsWith("/"))
      throw new RangeError(`panels: ${name}'s path "${panel.path}" does not start with "/"`);
    if (!areas.includes(panel.area))
      throw new RangeError(
        `panels: ${name}'s area ${JSON.stringify(panel.area)} is not an ApiArea`,
      );
    out[name] = Object.freeze({ key: panel.key, path: panel.path, area: panel.area });
  }
  return Object.freeze(out) as D;
}
