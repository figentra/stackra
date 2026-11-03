/**
 * Stackra file contract:
 * Purpose: `BentoGridBlockProps`, what a page hands the BentoGridBlock: its column count and its cards.
 * Boundary: an interface in its own file beside the component (ADR 0305). The cards and their words are page content.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0305 (`<name>.props.ts`); STA-2041.
 */
import type { ReactNode } from "react";

/**
 * A bento grid of cards.
 *
 * @example
 * <BentoGridBlock><BentoCard title="Decorators, not frameworks." span={2} /></BentoGridBlock>
 */
export interface BentoGridBlockProps {
  /** The columns from `md` up, 1 or 2; narrow screens always stack. Defaults to 2. */
  readonly columns?: 1 | 2 | undefined;
  /** The cards, usually `BentoCard`s; a card with `span={2}` takes both columns. */
  readonly children: ReactNode;
  /** Styles the grid. */
  readonly className?: string | undefined;
}
