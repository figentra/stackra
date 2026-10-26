/**
 * Stackra file contract:
 * Purpose: the props the web `PromptInput` compound takes from the shared vocabulary: its size, its disabled and
 *          loading states, and the accessible names of its text area, send button and icon actions.
 * Boundary: types only; web only. HeroUI Pro's `status`, `layout`, `variant` (the surface), `onSubmit` and `onStop`
 *          have no vocabulary name and keep theirs, as does every other prop, and pass through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { Size } from "@stackra/ui/contracts";
import type { ReactNode } from "react";

/** Props of the `PromptInput` root that the Stackra vocabulary names. */
export interface PromptInputContractProps {
  /** The shell, the footer and any other parts of the composer. */
  readonly children: ReactNode;
  /** The size of the composer. Defaults to `md`. */
  readonly size?: Size | undefined;
  /** Whether the composer refuses typing and sending. */
  readonly isDisabled?: boolean | undefined;
  /** Whether a reply is being generated, which swaps the send button for stop; HeroUI Pro's `isPending`. */
  readonly isLoading?: boolean | undefined;
}
