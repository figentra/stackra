/**
 * Stackra file contract:
 * Purpose: `ChatSourceTriggerProps`, props of `ChatSource.Trigger`, HeroUI Pro's: a link's, with a `label` drawn when
 *          there are no children.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ComponentPropsWithoutRef, ReactNode } from "react";

/** Props of `ChatSource.Trigger`, HeroUI Pro's: a link's, with a `label` drawn when there are no children. */
export interface ChatSourceTriggerProps extends ComponentPropsWithoutRef<"a"> {
  /** What the link shows in place of the icon and the title. */
  readonly label?: ReactNode;
}
