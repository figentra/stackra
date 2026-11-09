/**
 * Stackra file contract:
 * Purpose: `SwitcherStep`, one step of the step switcher: its id, its tab words, its title and line, and its code.
 * Boundary: a type only, the field type of `StepSwitcherBlock`.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";

import type { CodeSample } from "#core/types/code-sample.type";

/** A step and its code. */
export interface SwitcherStep {
  readonly id: string;

  readonly label: LocalizedText;

  readonly title: LocalizedText;

  readonly body: LocalizedText;

  readonly code: CodeSample;
}
