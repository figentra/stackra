/**
 * Stackra file contract:
 * Purpose: `Panel({ path, area })`, the kind base of an app's panel: where the app mounts it and the API area it
 *          hosts, so gen places every resource, widget, document and settings page of that area into it.
 * Boundary: called only; registered as the `panel` kind, not a binding. A declaration only: the panel renders its own
 *           shell and the server scopes every query, so nothing here grants access. Packages and services name an
 *           area, never a panel. The key is derived from the file. `PanelBase` is the instance base; the entry
 *           exports it as a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0164 (decision 3: several panels); ADR 0082 (API areas); ADR 0294 (decisions 14, 16 and
 *                     20); ADR 0305 (rule 43).
 */
import { createKind } from "@stackra/container";
import { ApiArea, Enum } from "@stackra/contracts";

import type { PanelOptions } from "#core/types/panel-options.type";

/** The instance side of a panel: data only, so nothing beyond the kind brand. */
export abstract class PanelBase {
  /** Type-only kind brand, so a class of another kind cannot stand in for a panel. */
  declare protected readonly "~kind": "panel";
}

/** The one called form. */
type PanelForm = (options: PanelOptions) => abstract new () => PanelBase;

/** Checks the options and records them frozen (an object type, so the kind registry takes it). */
function read(options?: Partial<PanelOptions>) {
  const path = options?.path;
  if (typeof path !== "string" || !path.startsWith("/"))
    throw new TypeError(`Panel({ path }) starts with "/", got ${JSON.stringify(path)}`);
  const area = options?.area;
  if (area === undefined || !Enum.values(ApiArea).includes(area))
    throw new TypeError(`Panel({ area }) is an ApiArea, got ${JSON.stringify(area)}`);
  return Object.freeze({ path, area });
}

/**
 * The panel kind base.
 *
 * @example
 * export class AdminPanel extends Panel({ path: "/", area: ApiArea.Admin }) {}
 */
export const Panel = createKind("panel", PanelBase, read) as PanelForm;
