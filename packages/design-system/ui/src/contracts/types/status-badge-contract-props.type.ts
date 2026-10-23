/**
 * Stackra file contract:
 * Purpose: the props every runtime's `StatusBadge` takes: the state of a record as text, with a dot in the state's
 *          tone before it. The text carries the meaning; the dot only repeats it in colour.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (UI contract); WCAG 2.2 SC 1.4.1 (use of colour).
 */
import type { ReactNode } from "react";

import type { Size } from "#contracts/enums/size.enum";
import type { Tone } from "#contracts/enums/tone.enum";

/** Props shared by the web and native `StatusBadge`. */
export interface StatusBadgeContractProps {
  /** The state's name in the app's language, for example "Active"; required because the dot alone means nothing. */
  readonly children: ReactNode;
  /** The colour role of the dot: `success`, `warning`, `danger`, `accent`, or `default` for a neutral state. */
  readonly tone?: Tone | undefined;
  /** The padding and text size of the badge. Defaults to `md`. */
  readonly size?: Size | undefined;
}
