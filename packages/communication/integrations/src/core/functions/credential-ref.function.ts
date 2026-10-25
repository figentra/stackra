/**
 * Stackra file contract:
 * Purpose: `credentialRef(provider, connectionId)` and its reverse, `credentialRef.parse(ref)`: the one spelling of a
 *          reference to a Connection in the integrations vault.
 * Boundary: pure; no lookup. A malformed reference is a `TypeError`, so a bad stored value never reaches the store.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 2); round 3 #10; JUR-97.
 */
import type { CredentialRef } from "#contracts/types/credential-ref.type";

/** `<provider>:conn_<id>`. */
const REF = /^([a-z0-9]+(?:[-_][a-z0-9]+)*):(conn_[0-9a-z]+)$/;

/** Splits a reference into its provider code and connection id. */
function parse(ref: string): { readonly provider: string; readonly connectionId: string } {
  const match = REF.exec(ref);
  if (match === null) throw new TypeError(`"${ref}" is not a credential reference`);
  return { provider: match[1] ?? "", connectionId: match[2] ?? "" };
}

/**
 * The reference to connection `connectionId` of `provider`.
 *
 * @throws TypeError when the parts do not make a reference.
 * @example
 * const ref = credentialRef("najiz", connection.id); // "najiz:conn_01j…"
 * credentialRef.parse(ref); // { provider: "najiz", connectionId: "conn_01j…" }
 */
export const credentialRef = Object.assign(
  (provider: string, connectionId: string): CredentialRef => {
    const ref = `${provider}:${connectionId}`;
    parse(ref);
    return ref as CredentialRef;
  },
  { parse },
);
