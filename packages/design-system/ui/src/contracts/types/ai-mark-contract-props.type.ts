/**
 * Stackra file contract:
 * Purpose: the props every runtime's `AiMark` takes: which mark it is, its accessible name, whether the name is shown,
 *          and its size.
 * Boundary: types only. The label is required, so a screen reader always hears what the mark means; the wording is the
 *           product's (its assistant's name, OS-335).
 * Runtime: isomorphic
 * Governing contract: ADR 0360 (decision 11); ADR 0302 (decision 3); WCAG 2.2 SC 1.1.1.
 */
import type { AiMarkKind } from "#contracts/enums/ai-mark-kind.enum";
import type { Size } from "#contracts/enums/size.enum";

/** Props shared by the web and native `AiMark`. */
export interface AiMarkContractProps {
  /** What the mark says: the agent can run it, an agent changed it, or AI generated it. */
  readonly kind: AiMarkKind;
  /** What the mark means, in the app's language (`Your assistant can do this`); read by screen readers. */
  readonly label: string;
  /** True to show the label beside the mark; required on content shown to consumers. */
  readonly isLabelVisible?: boolean | undefined;
  /** The mark's size; `sm` when left out. */
  readonly size?: Size | undefined;
}
