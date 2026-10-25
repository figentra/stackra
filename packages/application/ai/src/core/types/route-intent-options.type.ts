/**
 * Stackra file contract:
 * Purpose: `RouteIntentOptions`, what `routeIntent` may fall back to when no phrase matches: a model to choose among the
 *          intents, with optional instructions and an abort signal.
 * Boundary: a type only; without a model the router matches phrases only.
 * Runtime: isomorphic
 * Governing contract: ADR 0245 (decision 4).
 */
import type { DecideOptions } from "#core/types/decide-options.type";

/** The router's model fallback. */
export type RouteIntentOptions = Partial<
  Pick<DecideOptions, "model" | "instructions" | "abortSignal">
>;
