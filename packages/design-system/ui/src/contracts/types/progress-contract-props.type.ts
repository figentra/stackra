/**
 * Stackra file contract:
 * Purpose: the props every progress indicator takes, whatever its shape: the value within a range, its size and tone,
 *          the accessible name every indicator needs, and an optional spoken text for the value. ProgressBar extends it
 *          with the visible label and value; ProgressCircle takes it as it is.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7: props vocabulary);
 *          ADR 0312; WCAG 2.2 SC 4.1.2 (a progress bar has a name and a value).
 */
import type { Tone } from "@stackra/contracts";

import type { Size } from "#contracts/enums/size.enum";

/** Props shared by every progress indicator on web and native. */
export interface ProgressContractProps {
  /**
   * How far along it is, from `minValue` to `maxValue`; a number outside the range is held to its nearest end. Left
   * out, the indicator is indeterminate: the work is under way and its end is unknown.
   */
  readonly value?: number | undefined;
  /** The value that means nothing done yet. Defaults to 0. */
  readonly minValue?: number | undefined;
  /** The value that means done. Defaults to 100. */
  readonly maxValue?: number | undefined;
  /** The thickness of a bar, or the diameter of a circle. Defaults to `md`. */
  readonly size?: Size | undefined;
  /** The colour role of the fill; `default` is the foreground colour. Defaults to `accent`, as in HeroUI. */
  readonly tone?: Tone | undefined;
  /**
   * The accessible name, for example "Uploading invoices". Required: an unnamed progress bar is a barrier for a screen
   * reader user. A bar can also show it, see `isLabelVisible`.
   */
  readonly label: string;
  /**
   * The spoken text of the value, for example "3 of 12 files", in place of the percentage. Left out, the percentage
   * in the reader's locale is spoken. It is the shown text too when a bar's value is visible.
   */
  readonly valueLabel?: string | undefined;
}
