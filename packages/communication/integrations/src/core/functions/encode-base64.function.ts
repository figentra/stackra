/**
 * Stackra file contract:
 * Purpose: `encodeBase64`, Base64 of a UTF-8 string or of bytes, in the standard alphabet (HTTP Basic) or the URL
 *          alphabet without padding (JWT).
 * Boundary: internal and isomorphic: `btoa` and `TextEncoder` exist in Node, Workers and browsers; no `Buffer`.
 * Runtime: isomorphic
 * Governing contract: RFC 4648 (sections 4 and 5); RFC 7617 (Basic); RFC 7515 (base64url in JWS).
 */

/**
 * The Base64 text of `input`.
 *
 * @example
 * encodeBase64("user:pass"); // "dXNlcjpwYXNz"
 * encodeBase64('{"alg":"HS256"}', "base64url"); // "eyJhbGciOiJIUzI1NiJ9"
 */
export function encodeBase64(
  input: string | Uint8Array,
  alphabet: "base64" | "base64url" = "base64",
): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const text = btoa(binary);
  return alphabet === "base64"
    ? text
    : text.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
