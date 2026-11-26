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
  /** The step's id, unique in its switcher. */
  readonly id: string;

  /** The words on the step's tab. */
  readonly label: LocalizedText;

  /** The step's title, above its code. */
  readonly title: LocalizedText;

  /** The line under the title. */
  readonly body: LocalizedText;

  /** The code the step shows. */
  readonly code: CodeSample;
}
