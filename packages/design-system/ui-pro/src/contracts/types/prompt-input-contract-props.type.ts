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

/** Props of `PromptInput.TextArea` that the Stackra vocabulary names. */
export interface PromptInputTextAreaContractProps {
  /** The accessible name of the text area; HeroUI Pro's `aria-label`, "Message input" when left out. */
  readonly label?: string | undefined;
}

/** Props of `PromptInput.Send` that the Stackra vocabulary names. */
export interface PromptInputSendContractProps {
  /** The accessible name of the icon-only send button; HeroUI Pro's `aria-label`, "Send message" or "Stop" when left out. */
  readonly label?: string | undefined;
  /** Whether the button shows its busy state; HeroUI Pro's `isPending`. */
  readonly isLoading?: boolean | undefined;
}

/** Props of `PromptInput.Action` that the Stackra vocabulary names. */
export interface PromptInputActionContractProps {
  /** The accessible name of the icon-only action button; HeroUI Pro's `aria-label`, which it has no default for. */
  readonly label: string;
  /** The icon of the action. */
  readonly children: ReactNode;
}
