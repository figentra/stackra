/**
 * Stackra file contract:
 * Purpose: `decide`, one typed answer from a model on AI SDK core: one of the given choices, a score in a range, or
 *          yes or no. The structured-output call, the schema and the parsing are AI SDK's (`generateText` with
 *          `Output.choice` and `Output.object`); this adds the typed result and the checks.
 * Boundary: one model call, no tools, no retries of its own beyond AI SDK's, no state. The model is a provider model
 *           instance; a model id string is refused (it would reach AI SDK's hosted gateway). Validation of the
 *           arguments happens before the call; an answer outside the choices or the range is AI SDK's
 *           `NoObjectGeneratedError`. Runs where the model's credentials are, in practice the service.
 * Runtime: isomorphic
 * Governing contract: owner decision R-67 (2026-10-24: stay on AI SDK core, add a typed decide helper); ADR 0155; ADR
 *                     0227 (no LLM proxy gateway, no separate agent runtime).
 */
import { generateText, Output } from "ai";
import { z } from "zod";

import type { DecideOptions } from "#core/types/decide-options.type";

/** The two codes a yes-or-no decision is asked as. */
const YES_NO = ["yes", "no"];

/**
 * Asks `model` to pick one of `choices`.
 *
 * @returns the choice, typed as the union of the given strings.
 * @throws RangeError when fewer than two distinct, non-empty choices are given.
 * @example
 * const route = await decide({ model, prompt: `Route this message: ${text}`, choices: ["billing", "orders", "other"] });
 */
export function decide<const C extends string>(
  options: DecideOptions & { readonly choices: readonly C[] },
): Promise<C>;
/**
 * Asks `model` for a score from `score.min` to `score.max`.
 *
 * @throws RangeError when the bounds are not finite or `min` is not below `max`.
 * @example
 * const urgency = await decide({ model, prompt: `How urgent is this ticket? ${text}`, score: { min: 1, max: 5 } });
 */
export function decide(
  options: DecideOptions & { readonly score: { readonly min: number; readonly max: number } },
): Promise<number>;
/**
 * Asks `model` a yes-or-no question.
 *
 * @example
 * const isComplaint = await decide({ model, prompt: `Is this a complaint? ${text}`, yesNo: true });
 */
export function decide(options: DecideOptions & { readonly yesNo: true }): Promise<boolean>;
export async function decide(
  options: DecideOptions &
    (
      | { readonly choices: readonly string[] }
      | { readonly score: { readonly min: number; readonly max: number } }
      | { readonly yesNo: true }
    ),
): Promise<string | number | boolean> {
  if (typeof options.model !== "object" || options.model === null)
    throw new TypeError(
      "decide({ model }) takes a provider model instance; a model id string would go through AI SDK's hosted gateway (ADR 0155)",
    );
  const call = {
    model: options.model,
    prompt: options.prompt,
    ...(options.instructions !== undefined && { instructions: options.instructions }),
    ...(options.abortSignal !== undefined && { abortSignal: options.abortSignal }),
  };
  if ("choices" in options) {
    const { choices } = options;
    if (
      choices.length < 2 ||
      new Set(choices).size !== choices.length ||
      choices.some((choice) => typeof choice !== "string" || choice === "")
    )
      throw new RangeError(
        `decide({ choices }) takes at least two distinct, non-empty strings, got ${JSON.stringify(choices)}`,
      );
    const { output } = await generateText({
      ...call,
      output: Output.choice({ options: [...choices] }),
    });
    return output;
  }
  if ("score" in options) {
    const { min, max } = options.score;
    if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max)
      throw new RangeError(
        `decide({ score }) takes finite bounds with min below max, got ${JSON.stringify(options.score)}`,
      );
    const { output } = await generateText({
      ...call,
      output: Output.object({ schema: z.object({ score: z.number().min(min).max(max) }) }),
    });
    return output.score;
  }
  const { output } = await generateText({ ...call, output: Output.choice({ options: YES_NO }) });
  return output === "yes";
}
