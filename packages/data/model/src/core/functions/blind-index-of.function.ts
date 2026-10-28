/**
 * Stackra file contract:
 * Purpose: `blindIndexOf`, the blind index of one plain value: an HMAC-SHA-256 of the value under a key derived from
 *          the scope's current data key, bound to the field's cipher context, so equal values in one column give
 *          equal indexes and an encrypted field can be looked up by equality without a deterministic cipher.
 * Boundary: Web Crypto only. The HMAC key is derived with HKDF (info `stackra:blind-index`) and never equals the
 *           sealing key; the context is inside the MAC, so equal values in two columns never match. The result is
 *           `<keyId>.<hex>`, naming the key it was made under, so the key-usage report and the re-seal job can find
 *           an index made under a retired key. Exact equality only: the caller normalises (case, spaces) first.
 * Runtime: isomorphic
 * Governing contract: ADR 0188 (decision 2); ADR 0173; ADR 0160 (no database-side crypto); gap gov9 (stackra-313).
 */
import type { KeyProvider } from "@stackra/contracts";

/** What binds the derived HMAC key to this use. */
const INFO = new TextEncoder().encode("stackra:blind-index");

/**
 * The blind index of `plain` in `context` under `keys`' current key.
 *
 * @param keys - the scope's key provider.
 * @param plain - the plain value.
 * @param context - the field's cipher context, `<model key>.<field>`.
 * @example
 * await blindIndexOf(keys, "hala@example.com", "crm.lead.email"); // "k2.5f1c…"
 */
export async function blindIndexOf(
  keys: KeyProvider,
  plain: string,
  context: string,
): Promise<string> {
  const { id, key } = await keys.current();
  const material = await globalThis.crypto.subtle.importKey(
    "raw",
    new Uint8Array(key),
    "HKDF",
    false,
    ["deriveKey"],
  );
  const hmac = await globalThis.crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: new Uint8Array(), info: INFO },
    material,
    { name: "HMAC", hash: "SHA-256", length: 256 },
    false,
    ["sign"],
  );
  // the newline cannot occur in a context, so a context and a value never run together
  const digest = await globalThis.crypto.subtle.sign(
    "HMAC",
    hmac,
    new TextEncoder().encode(`${context}\n${plain}`),
  );
  const hex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `${id}.${hex}`;
}
