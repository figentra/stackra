/**
 * Stackra file contract:
 * Purpose: `AgendaHeadingProps`, props of `Agenda.Heading`: a heading's own props, plus the level the page outline
 *          gives it.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import type { HeadingLevel } from "@stackra/ui/contracts";
import type { ComponentPropsWithoutRef } from "react";

/** Props of `Agenda.Heading`: a heading's own props, plus the level the page outline gives it. */
export interface AgendaHeadingProps extends ComponentPropsWithoutRef<"h2"> {
  /** The heading level, `h2` unless told otherwise. */
  readonly level?: HeadingLevel | undefined;
}
