/**
 * Stackra file contract:
 * Purpose: `CredentialRef`, what a product or service stores in place of a credential: `<provider>:<connection id>`,
 *          a reference to a Connection held in the integrations vault (the hosted connection store), never the secret.
 * Boundary: a type only; `credentialRef` builds one and `ProviderResolver#byRef` loads the Connection it names, through
 *           the store, which applies the caller's scope. A court portal login per lawyer or a tenant's own provider
 *           account is stored this way (JUR-97).
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 2 and 12); round 3 #10; JUR-97.
 */

/** `<provider>:<connection id>`. */
export type CredentialRef = `${string}:conn_${string}`;
