/**
 * Stackra file contract:
 * Purpose: `PromptOptions`, what `Prompt({...})` takes: the prompt's major version.
 * Boundary: a type only. Everything else is bound by name, never written: the template and the evaluation set are the
 *           module assets `<module>::ai/<stem>.md` and `<module>::ai/<stem>.eval.json`, and the arguments are the
 *           `<Name>Input` schema in `schemas/` (ADR 0305 rule 11). A prompt that sets no option is written bare.
 * Runtime: isomorphic
 * Governing contract: ADR 0245 (decision 6, as amended by ADR 0294 and ADR 0305); ADR 0294 (2026-10-23 item 5: bare or
 *                     called).
 */

/** The options of a prompt. */
export interface PromptOptions {
  /** The major version, a whole number from 1; `1` when absent. An older version stays callable for 12 months. */
  readonly version?: number;
}
