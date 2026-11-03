/**
 * Stackra file contract:
 * Purpose: `Surface`, one surface the action is drawn on: a web or desktop window, or a phone, with its title and the
 *          action's button.
 * Boundary: a shape class only, the field type of `Machine` and `SurfacesBlock`; gen compiles it with them. A
 *           surface's words are the drawn app's own, in its `lang` (BCP 47; `ar` draws right to left), not the page's
 *           locale, so they are plain strings: the phone shows the Arabic button on the English page too.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0305 (one declaration per file); STA-2041.
 */
import { Schema } from "@stackra/validation";

import type { SurfaceKind } from "#core/enums/surface-kind.enum";

/** A surface and its button. */
export class Surface extends Schema {
  id!: string;

  kind!: SurfaceKind;

  /** The window's title. */
  title!: string;

  /** The button's words. */
  button!: string;

  /** The language of `title` and `button`; the page's when absent. */
  lang?: string;
}
