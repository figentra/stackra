/**
 * Stackra file contract:
 * Purpose: `matchKeysOf(person, format)`, the one place a person's email, phone and id become ad-platform `MatchKeys`:
 *          normalised as the platforms publish (email trimmed and lowercased; phone in E.164 with its `+`, or its
 *          digits only) and SHA-256 hashed to lowercase hex.
 * Boundary: pure; Web Crypto only (`crypto.subtle`), so it runs in Node, Workers and the browser. The phone format is
 *           the Connection's setting (Google Ads and TikTok hash `+9665…`, Meta and Snap `9665…`), never a branch on a
 *           vendor. A blank field is left out; a person with nothing to match by is a `TypeError`, since an empty
 *           member would match no one.
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decision 1); ADR 0134 (personal data); STA-793.
 */
import type { MatchKeys } from "#contracts/ads/match-keys.type";

/** Lowercase hex SHA-256 of `text`'s UTF-8 bytes. */
async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * The hashed match keys of `person`.
 *
 * @param person - the plain identifiers; the phone in E.164 (`+9665…`).
 * @param format - how the platform wants the phone before hashing: `e164` keeps the `+`, `digits` drops it.
 * @throws TypeError when the person has no email, phone or id.
 * @example
 * const keys = await matchKeysOf({ email: " A@B.example ", phone: "+966500000000" }, { phone: "digits" });
 */
export async function matchKeysOf(
  person: { readonly email?: string; readonly phone?: `+${string}`; readonly externalId?: string },
  format: { readonly phone: "e164" | "digits" },
): Promise<MatchKeys> {
  const email = person.email?.trim().toLowerCase();
  const digits = person.phone?.replaceAll(/\D/g, "");
  const externalId = person.externalId?.trim();
  const keys: { email?: string; phone?: string; externalId?: string } = {};
  if (email) keys.email = await sha256(email);
  if (digits) keys.phone = await sha256(format.phone === "e164" ? `+${digits}` : digits);
  if (externalId) keys.externalId = await sha256(externalId);
  if (Object.keys(keys).length === 0)
    throw new TypeError("A person needs an email, a phone or an id to match by");
  return keys;
}
