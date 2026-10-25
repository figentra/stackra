/**
 * Stackra file contract:
 * Purpose: `ProtectedResourceOptions`, what the host passes to describe its MCP endpoint as an OAuth protected
 *          resource: the resource URL, the authorization servers (the identity provider's issuer), and optionally the
 *          scopes, a display name and a documentation URL.
 * Boundary: a type only. Every value is the host's configuration (per region and environment); nothing here names a
 *           provider or a domain.
 * Runtime: isomorphic
 * Governing contract: ADR 0348 (decision 2: protected-resource metadata naming the identity provider); ADR 0155
 *                     (decision 4); RFC 9728.
 */

/** The protected resource of one hosted MCP endpoint. */
export type ProtectedResourceOptions = {
  /** The MCP endpoint's URL, its resource identifier; https, or http on a loopback host. */
  readonly resource: string;

  /** The issuer URLs of the authorization servers that grant tokens for it; at least one. */
  readonly authorizationServers: readonly string[];

  /** The scopes a client may ask for. */
  readonly scopes?: readonly string[];

  /** A human-readable name of the resource. */
  readonly name?: string;

  /** A page that documents the resource. */
  readonly documentation?: string;
};
