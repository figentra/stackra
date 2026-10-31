/**
 * Stackra file contract:
 * Purpose: `ReasoningStep`, one step of a `Reasoning` trace: a short label and what the agent did or thought.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { ReactNode } from "react";

/** One step of the assistant's reasoning. */
export interface ReasoningStep {
  /** Unique within the trace. */
  readonly key: string;
  /** A short label above the step, such as "Searched the web". */
  readonly label?: string | undefined;
  /** What happened: text, a file row, an image or a nested `Reasoning`. */
  readonly content: ReactNode;
}
