/**
 * Stackra file contract:
 * Purpose: `PromptClass`, the class type `Prompt` and `Prompt({...})` give and every prompt class fits, so a consumer's
 *          declaration emit can name it.
 * Boundary: a type only (ADR 0294 decision 25: each factory returns an exported, named class type). Its constructor
 *           takes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 25); ADR 0305 (rule 43).
 */
import type { Prompt } from "#core/bases/prompt.base";

/** A prompt class. */
export type PromptClass = abstract new () => Prompt;
