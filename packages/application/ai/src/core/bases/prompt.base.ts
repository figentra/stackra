/**
 * Stackra file contract:
 * Purpose: `Prompt`, the kind base of a versioned MCP prompt in a module's `ai/` group: `extends Prompt` for version 1,
 *          `extends Prompt({ version })` once it changes. The interface of the same name is its instance side.
 * Boundary: in both forms (ADR 0294 2026-10-23 item 5). The class declares no template: the template and its evaluation
 *           set are module assets bound by the stem (`<module>::ai/<stem>.md`, `<module>::ai/<stem>.eval.json`) and
 *           its arguments are the `<Name>Input` schema in `schemas/`; gen writes all three into the prompt table of
 *           `#stackra/ai`, the MCP gateway serves it, and CI runs the evaluation set. No state, no dependencies.
 * Runtime: isomorphic
 * Governing contract: ADR 0245 (decision 6, as amended by ADR 0294 and ADR 0305); ADR 0294 (decisions 13, 16 and 25);
 *                     ADR 0305 (rules 2, 3 and 11); ADR 0156 (decision 4: every prompt has an eval suite).
 */
import { createKind } from "@stackra/container";

import type { PromptClass } from "#core/types/prompt-class.type";
import type { PromptOptions } from "#core/types/prompt-options.type";

/** The instance side every prompt shares. */
export interface Prompt {
  /** Type-only kind brand, so a class of another kind cannot stand in for a prompt. */
  readonly "~kind": "prompt";
}

/** Checks the options of a called prompt and applies their defaults. */
function read(options: PromptOptions = {}) {
  const version = options.version ?? 1;
  if (!Number.isInteger(version) || version < 1)
    throw new RangeError(`Prompt({ version }) must be a whole number from 1, got ${version}`);
  return { ...options, version };
}

/**
 * The prompt kind base.
 *
 * @example
 * export class ExplainOrderPrompt extends Prompt {}
 * export class ExplainInvoicePrompt extends Prompt({ version: 2 }) {}
 */
export const Prompt = createKind(
  "prompt",
  // The runtime base: empty, so a prompt class keeps no state.
  // oxlint-disable-next-line typescript/no-extraneous-class -- reason: a kind base is empty on purpose (0294 d25)
  class PromptBase {},
  read,
) as PromptClass & ((options: PromptOptions) => PromptClass);
