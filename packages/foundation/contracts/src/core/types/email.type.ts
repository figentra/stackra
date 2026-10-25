/**
 * Stackra file contract:
 * Purpose: `Email`: an email address in a shape, an option or a config field.
 * Boundary: a type only. The `@` is checked at compile time so a literal default reads naturally
 *           (`fromAddress: Email = "orders@acme.example"`); the full address rule is the generated schema's, which
 *           compiles this type to an email check.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: the shape compiler maps platform types), ADR 0095 (types are the rules).
 */

/** An email address. Compare addresses case-insensitively; the type does not normalise them. */
export type Email = `${string}@${string}`;
