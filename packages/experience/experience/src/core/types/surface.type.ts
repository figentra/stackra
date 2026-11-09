/**
 * Stackra file contract:
 * Purpose: `Surface`, one surface the action is drawn on: a web or desktop window, or a phone, with its title and the
 *          action's button.
 * Boundary: a type only, the field type of `Machine` and `SurfacesBlock`. A surface's words are the drawn app's own, in
 *           its `lang` (BCP 47; `ar` draws right to left), not the page's locale, so they are plain strings: the phone
 *           shows the Arabic button on the English page too.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-2041.
 */
import type { SurfaceKind } from "#core/enums/surface-kind.enum";

/** A surface and its button. */
export interface Surface {
  /** The surface's id, unique in its machine. */
  readonly id: string;

  /** A web or desktop window, or a phone. */
  readonly kind: SurfaceKind;

  /** The window's title. */
  readonly title: string;

  /** The button's words. */
  readonly button: string;

  /** The language of `title` and `button`; the page's when absent. */
  readonly lang?: string;
}
