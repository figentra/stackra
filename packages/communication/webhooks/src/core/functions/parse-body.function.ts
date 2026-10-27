/**
 * Stackra file contract:
 * Purpose: `parseBody`, the JSON a webhook body holds, or `undefined` when it is not JSON.
 * Boundary: internal; only a scheme whose token or signed fields sit inside the body parses it before verifying, and
 *           reads nothing but those fields until the check passes. Never throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 15); STA-1357.
 */

/**
 * The parsed body.
 *
 * @example
 * parseBody('{"id":1}'); // { id: 1 }
 */
export function parseBody(body: string): unknown {
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return undefined;
  }
}
