/**
 * Stackra file contract:
 * Purpose: the web `ChainOfThought` compound on HeroUI Pro's ChainOfThought: a collapsible reasoning timeline with
 *          the parts Trigger, Content, Steps and Step, HeroUI Pro's own.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. HeroUI Pro's names already
 *          follow the vocabulary (`isStreaming`, `isExpanded`), so nothing is renamed. The compound exposes the
 *          documented parts: HeroUI Pro's `ChainOfThought.Root` is left out. Imports the `chain-of-thought` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import { ChainOfThought as HeroChainOfThought } from "@heroui-pro/react/chain-of-thought";

import type { ChainOfThoughtProps } from "#react/chain-of-thought/chain-of-thought.props";

/** The root: HeroUI Pro's disclosure, which shimmers the trigger while `isStreaming`. */
function ChainOfThoughtRoot(props: ChainOfThoughtProps) {
  return <HeroChainOfThought.Root {...props} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface ChainOfThoughtParts {
  /** The button that expands and collapses the timeline. */
  readonly Trigger: typeof HeroChainOfThought.Trigger;
  /** The collapsible body. */
  readonly Content: typeof HeroChainOfThought.Content;
  /** The list that holds the steps. */
  readonly Steps: typeof HeroChainOfThought.Steps;
  /** One step: a `label` and its text. */
  readonly Step: typeof HeroChainOfThought.Step;
}

/** A collapsible reasoning timeline: `ChainOfThought.Trigger`, then `Content` holding `Steps` of `Step`. */
export const ChainOfThought: typeof ChainOfThoughtRoot & ChainOfThoughtParts = Object.assign(
  ChainOfThoughtRoot,
  {
    Trigger: HeroChainOfThought.Trigger,
    Content: HeroChainOfThought.Content,
    Steps: HeroChainOfThought.Steps,
    Step: HeroChainOfThought.Step,
  },
);
