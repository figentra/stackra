/**
 * Stackra file contract:
 * Purpose: `SECRET_FIELD_SUFFIXES`, the endings of a field name whose value an audit entry never keeps, beside the
 *          fields declared `secret: true`.
 * Boundary: data only; compared with the field name in lower case and without separators.
 * Runtime: isomorphic
 * Governing contract: STA-1731 spec FR-016.
 */

/** A field whose name ends in one of these is redacted. */
export const SECRET_FIELD_SUFFIXES: readonly string[] = Object.freeze([
  "password",
  "secret",
  "token",
  "key",
  "credential",
  "credentials",
  "passphrase",
  "pwd",
  "dsn",
  "url",
  "cookie",
]);
