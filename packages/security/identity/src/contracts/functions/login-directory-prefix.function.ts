/**
 * Stackra file contract:
 * Purpose: `loginDirectoryPrefix(identifier, key)`, the one place the login directory's key format is written: the
 *          identifier is normalised (an email trimmed and lower-cased, a phone stripped to E.164), hashed with
 *          HMAC-SHA-256 under the directory key, and returned as `dir:<key id>:<kind>:<hex>:`. A region appends its
 *          region key to write its row; the edge Worker lists the prefix to learn every region holding an account.
 * Boundary: pure apart from Web Crypto, so the same code runs in a region and in the Worker. Never logs or returns the
 *           identifier; an identifier that does not normalise (unknown kind, no `@`, not E.164) gives `undefined`,
 *           since no row can exist for it.
 * Runtime: isomorphic
 * Governing contract: ADR 0353 (decision 4: keyed hashes only); OS ADR 0002 (decision 1); ADR 0451.
 */
import type { LoginDirectoryKey } from "#contracts/types/login-directory-key.type";

/** The kind's normal form, or `undefined` when the value is not one. */
const NORMALISE: Readonly<Record<string, (value: string) => string | undefined>> = {
  email: (value) => {
    const email = value.normalize("NFKC").trim().toLowerCase();
    return email.length <= 254 && /^[^\s@]+@[^\s@]+$/.test(email) ? email : undefined;
  },
  phone: (value) => {
    const phone = value.replace(/[\s().-]/g, "");
    return /^\+[1-9]\d{6,14}$/.test(phone) ? phone : undefined;
  },
};

/**
 * The directory key prefix of `identifier` under `key`.
 *
 * @throws TypeError when the key id is empty or holds `:`, or the secret is empty.
 * @example
 * const prefix = await loginDirectoryPrefix({ kind: "email", value: " Ana@Example.com" }, key);
 * await directory.put([`${prefix}eu`]); // "dir:k1:email:<64 hex>:eu"
 */
export async function loginDirectoryPrefix(
  identifier: { readonly kind: string; readonly value: string },
  key: LoginDirectoryKey,
): Promise<string | undefined> {
  if (key.id === "" || key.id.includes(":") || key.secret === "")
    throw new TypeError("The login directory key needs an id without ':' and a secret");
  const normal = Object.hasOwn(NORMALISE, identifier.kind)
    ? NORMALISE[identifier.kind]?.(identifier.value)
    : undefined;
  if (normal === undefined) return undefined;

  const encoder = new TextEncoder();
  const hmac = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(key.secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  // The kind is inside the MAC as well as the key, so an email and a phone of equal text never collide.
  const digest = await globalThis.crypto.subtle.sign(
    "HMAC",
    hmac,
    encoder.encode(`${identifier.kind}:${normal}`),
  );
  const hex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `dir:${key.id}:${identifier.kind}:${hex}:`;
}
