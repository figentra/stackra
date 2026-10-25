/**
 * Stackra file contract:
 * Purpose: `providerCodeOf`, the provider's own error code in an error answer: the first machine code under `code`,
 *          `error`, `name` or `type`, at the top or inside an `error` object (`{ "name": "restricted_api_key" }`,
 *          `{ "error": "invalid_grant" }`, `{ "error": { "code": "card_declined" } }`).
 * Boundary: internal. Only a short code without spaces is taken, so a provider's message text, which may echo the
 *           request, never reaches a refusal's details.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 13 and 20).
 */

/** A machine code: no spaces, at most 100 characters. */
const CODE = /^[\w.:-]{1,100}$/;

/** The keys a provider names its code under, in the order they are tried. */
const KEYS = ["code", "error", "name", "type"] as const;

/**
 * The error code in `answer`, when it names one.
 *
 * @example
 * providerCodeOf({ statusCode: 401, name: "restricted_api_key", message: "..." }); // "restricted_api_key"
 */
export function providerCodeOf(answer: unknown): string | undefined {
  if (typeof answer !== "object" || answer === null) return undefined;
  const body = answer as Readonly<Record<string, unknown>>;
  for (const key of KEYS) {
    const value = body[key];
    const text = typeof value === "number" ? String(value) : value;
    if (typeof text === "string" && CODE.test(text)) return text;
  }
  const nested = body["error"];
  return typeof nested === "object" ? providerCodeOf(nested) : undefined;
}
