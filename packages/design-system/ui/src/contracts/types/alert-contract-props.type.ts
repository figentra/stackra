/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Alert` takes: an inline message that stays on the page, with a tone, a title,
 *          an optional description, an icon and optional actions. HeroUI names the tone `status`; the contract keeps
 *          `tone`, as every message does.
 * Boundary: types only. The title is required because it is what a screen reader reads first; an alert is announced
 *           by its tone (warning and danger at once, the rest politely) and never takes a role from the caller.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312 (decisions 1 and 3); WCAG 2.2 SC 1.4.1
 *          and 4.1.3.
 */
import type { ReactNode } from "react";

import type { FeedbackContractProps } from "#contracts/types/feedback-contract-props.type";

/** Props shared by the web and native `Alert`. */
export interface AlertContractProps extends FeedbackContractProps {
  /** What happened, in the app's language and a few words. Required: it is the first thing a screen reader says. */
  readonly title: ReactNode;
  /** Detail under the title: what to do next, or why. */
  readonly description?: ReactNode | undefined;
  /** Buttons or links for the reader's next step, drawn under the description in a wrapping row. */
  readonly actions?: ReactNode | undefined;
}
