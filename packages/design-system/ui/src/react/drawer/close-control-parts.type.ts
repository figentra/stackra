/**
 * Stackra file contract:
 * Purpose: `CloseControlParts`, what `closeControlOf` returns for a Drawer or Modal close trigger.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: STA-1371 (owner, 2026-10-29); ADR 0305 (rules 10 to 13).
 */
import type { ReactNode } from "react";

/** What a close trigger draws for `control`. */
export interface CloseControlParts {
  /** The trigger's content; undefined keeps HeroUI's close mark. */
  readonly children: ReactNode;
  /** Extra classes for the trigger. */
  readonly className: string | undefined;
  /** Whether the trigger shows the Escape key cap (named "Close, Esc"). */
  readonly isEsc: boolean;
}
