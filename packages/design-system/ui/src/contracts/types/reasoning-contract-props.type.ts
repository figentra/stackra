/**
 * Stackra file contract:
 * Purpose: `ReasoningContractProps`, the props every runtime's `Reasoning` takes: the assistant's reasoning and agent
 *          steps as a quiet disclosure ("Thought for 4s") over a vertical trace of steps.
 * Boundary: types only; it depends on no AI SDK: the app maps its stream to steps.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (component gaps, owner approval
 *          2026-10-31).
 */
import type { ReasoningStep } from "#contracts/types/reasoning-step.type";

/** Props shared by the web and native `Reasoning`. */
export interface ReasoningContractProps {
  /** The steps, in order. */
  readonly steps: readonly ReasoningStep[];
  /** The trigger's words, such as "Thought for 4s". Defaults to "Thinking…" while streaming, else "Reasoning". */
  readonly summary?: string | undefined;
  /** True while the reasoning runs: the trigger shimmers. */
  readonly isStreaming?: boolean | undefined;
  /** True while open, for a controlled trace; pair it with `onExpandedChange`. */
  readonly isExpanded?: boolean | undefined;
  /** True to start open, for an uncontrolled trace. */
  readonly defaultExpanded?: boolean | undefined;
  /** Called with the new state each time the trace opens or closes. */
  readonly onExpandedChange?: ((isExpanded: boolean) => void) | undefined;
}
