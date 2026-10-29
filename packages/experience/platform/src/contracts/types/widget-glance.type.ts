/**
 * Stackra file contract:
 * Purpose: `WidgetGlance`, what the home-screen and Lock Screen widget shows: a translated title, the one value a
 *          glance is for, and an optional caption.
 * Boundary: a type only; plain serialisable data, because the widget renders in the widget extension from the copy
 *           kept in the app group, not in the app. The product translates and formats every string first.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decision 3); ADR 0478 (decision 9); STA-1539.
 */

/** One glance a widget shows. */
export interface WidgetGlance {
  /** The translated headline (`Today's orders`, `Next booking`). */
  readonly title: string;

  /** The formatted value (`42`, `SAR 1,250`, `20:00`). */
  readonly value: string;

  /** A translated line under the value (`Up 8% on yesterday`); the inline Lock Screen widget leaves it out. */
  readonly caption?: string;
}
