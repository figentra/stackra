/**
 * Stackra file contract:
 * Purpose: `routeIntent(text, intents, options?)`, the intent router of the command palette and AI triggers: the key of
 *          the intent one of whose phrases the text is, else, given a model, the intent the model picks, else none.
 * Boundary: phrase matching ignores case, compatibility forms and extra white space. The model fallback is one
 *           `decide` call with the keys and a "none" choice; the router never runs the action, the caller does,
 *           through the pipeline and under the caller's permissions.
 * Runtime: isomorphic
 * Governing contract: ADR 0245 (decision 4); ADR 0155.
 */
import { decide } from "#core/functions/decide.function";
import type { Intent } from "#core/types/intent.type";
import type { RouteIntentOptions } from "#core/types/route-intent-options.type";

/** The model's answer when no intent fits; cannot collide with a key, which has no spaces. */
const NONE = "no matching intent";

/** `text` folded for comparison. */
const fold = (text: string): string =>
  text.normalize("NFKC").toLocaleLowerCase().replace(/\s+/gu, " ").trim();

/**
 * The key of the intent `text` names.
 *
 * @example
 * await routeIntent("Cancel order", [{ key: "orders.order.cancel@1", phrases: ["cancel order"] }]);
 * // "orders.order.cancel@1"
 */
export async function routeIntent(
  text: string,
  intents: readonly Intent[],
  options: RouteIntentOptions = {},
): Promise<string | undefined> {
  const folded = fold(text);
  const exact = intents.find((intent) => intent.phrases.some((phrase) => fold(phrase) === folded));
  if (exact !== undefined) return exact.key;
  const { model } = options;
  if (model === undefined || intents.length === 0 || folded === "") return undefined;
  const keys = [...new Set(intents.map((intent) => intent.key))];
  const answer = await decide({
    model,
    prompt: `Which of these actions does the request name? Request: ${JSON.stringify(text)}\n${intents
      .map((intent) => `${intent.key}: ${intent.phrases.join("; ")}`)
      .join("\n")}`,
    choices: [...keys, NONE],
    ...(options.instructions !== undefined && { instructions: options.instructions }),
    ...(options.abortSignal !== undefined && { abortSignal: options.abortSignal }),
  });
  return answer === NONE ? undefined : answer;
}
