/**
 * Stackra file contract:
 * Purpose: `oneTimeCodeDigest(pepper, purpose, subject, code)`, the hex HMAC-SHA-256 a one-time code is stored and
 *          compared as.
 * Boundary: internal to the one-time code functions. Web Crypto only. The three parts are joined with a separator no
 *           purpose or subject may hold, so no two inputs share a message.
 * Runtime: isomorphic
 * Governing contract: RFC 2104 (HMAC); conflict #2; ADR 0305.
 */

/** Joins the message parts; a unit separator never appears in a code, a purpose or an id. */
const SEPARATOR = "\u001f";

/**
 * The digest of `code` for `purpose` and `subject`.
 *
 * @throws TypeError when `pepper` is empty or a part holds the separator.
 * @example
 * await oneTimeCodeDigest(pepper, "login", "usr_1", "123456"); // "9f…"
 */
export async function oneTimeCodeDigest(
  pepper: string,
  purpose: string,
  subject: string,
  code: string,
): Promise<string> {
  if (pepper === "") throw new TypeError("oneTimeCodeDigest: the pepper is empty");
  if ([purpose, subject, code].some((part) => part.includes(SEPARATOR)))
    throw new TypeError("oneTimeCodeDigest: a part holds the separator");
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pepper),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode([purpose, subject, code].join(SEPARATOR)),
  );
  return [...new Uint8Array(mac)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
