/**
 * Stackra file contract:
 * Purpose: `SwitcherStep`, one step of the step switcher: its id, its tab words, its title and line, and its code.
 * Boundary: a shape class only, the field type of `StepSwitcherBlock`; gen compiles it with the block.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0305 (one declaration per file); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";
import { Schema } from "@stackra/validation";

import type { CodeSample } from "#core/schemas/code-sample.schema";

/** A step and its code. */
export class SwitcherStep extends Schema {
  id!: string;

  label!: LocalizedText;

  title!: LocalizedText;

  body!: LocalizedText;

  code!: CodeSample;
}
