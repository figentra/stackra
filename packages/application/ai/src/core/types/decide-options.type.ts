/**
 * Stackra file contract:
 * Purpose: `DecideOptions`, what every `decide(...)` call takes: the model, the question and optional instructions and
 *          abort signal. The answer's form (`choices`, `score` or `yesNo`) is added per overload.
 * Boundary: a type only. The model is an AI SDK provider model instance the service built (its key resolved at run
 *           time from a secret name, or a cloud role); a model id string is refused, because AI SDK resolves it through
 *           its hosted gateway, an LLM proxy ADR 0155 and ADR 0227 rule out.
 * Runtime: isomorphic
 * Governing contract: ADR 0155 (AI SDK core inside the service, no LLM proxy gateway); ADR 0156 (decision 2: provider
 *                     drivers); ADR 0100 (decision 14: secrets never reach the model).
 */
import type { LanguageModel } from "ai";

/** The options every `decide` call shares. */
export interface DecideOptions {
  /** The provider model instance (`bedrock("…")`, `anthropic("…")`, a local model); never a model id string. */
  readonly model: Exclude<LanguageModel, string>;

  /** The question, with the material it is about; untrusted content stays data, never instructions. */
  readonly prompt: string;

  /** System instructions for this one decision. */
  readonly instructions?: string;

  /** Cancels the model call, such as the action context's `abortSignal`. */
  readonly abortSignal?: AbortSignal;
}
