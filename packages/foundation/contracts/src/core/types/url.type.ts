/**
 * Stackra file contract:
 * Purpose: `Url`: an absolute URL in a shape, an option or a config field (`https://…`, or an app scheme such as
 *          `acme://`).
 * Boundary: a type only. The `scheme://` part is checked at compile time so a literal default reads naturally; the
 *           full URL rule is the generated schema's, which compiles this type to a URL check.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: the shape compiler maps platform types), ADR 0095 (types are the rules).
 */

/** An absolute URL with a scheme and an authority. A relative path is a plain `string`. */
export type Url = `${string}://${string}`;
