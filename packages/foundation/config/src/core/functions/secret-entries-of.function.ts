/**
 * Stackra file contract:
 * Purpose: `secretEntriesOf(name, text)`, the secrets one stored secret gives: a JSON object gives one secret per
 *          string member (`{ "RESEND_API_KEY": "…" }`), any other text is one secret under the stored secret's name.
 *          The AWS Secrets Manager and Google Secret Manager drivers share it, so both stores read one way.
 * Boundary: pure; it never prints, logs or throws a value. A member that is not a string is dropped.
 * Runtime: isomorphic
 * Governing contract: ADR 0173 (secrets by name); ADR 0371 (amendment 2026-11-27, STA-258).
 */

/**
 * The secrets the stored secret `name` with the text `text` gives, by name.
 *
 * @example
 * secretEntriesOf("app/prod", '{"RESEND_API_KEY":"re_x"}'); // [["RESEND_API_KEY", "re_x"]]
 * secretEntriesOf("RESEND_API_KEY", "re_x"); // [["RESEND_API_KEY", "re_x"]]
 */
export function secretEntriesOf(
  name: string,
  text: string,
): readonly (readonly [string, string])[] {
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed))
      return Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      );
  } catch {
    // Not JSON: one secret under the stored secret's name.
  }
  return [[name, text]];
}
