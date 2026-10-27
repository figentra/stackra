/**
 * Stackra file contract:
 * Purpose: `AI_METERS`, the usage meter of model calls: `ai.tokens`, with the key each direction's `usage.recorded`
 *          events carry (`ai.tokens.input`, `ai.tokens.output`).
 * Boundary: names only. One `sum` meter of exact tokens, so an entitlement limit on `ai.tokens` caps the whole AI
 *           spend of a scope; the price per token per model and any cap are plan catalogue and entitlement data,
 *           never here.
 * Runtime: isomorphic
 * Governing contract: ADR 0216 (decisions 1 and 2); ADR 0156 (enforcement: token budgets); STA-1377 (stackra-219).
 */

/**
 * The AI meters.
 *
 * @example
 * AI_METERS.input.name; // "ai.tokens"
 */
export const AI_METERS = Object.freeze({
  /** Prompt tokens sent to a model. */
  input: Object.freeze({ name: "ai.tokens", key: "ai.tokens.input" }),
  /** Tokens a model answered. */
  output: Object.freeze({ name: "ai.tokens", key: "ai.tokens.output" }),
} as const);
