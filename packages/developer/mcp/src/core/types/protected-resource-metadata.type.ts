/**
 * Stackra file contract:
 * Purpose: `ProtectedResourceMetadata`, the JSON document served at `/.well-known/oauth-protected-resource` for the
 *          hosted MCP endpoint, with the field names RFC 9728 fixes.
 * Boundary: a type only; `protectedResourceMetadata` builds it. Field names are snake_case because the RFC says so.
 * Runtime: isomorphic
 * Governing contract: ADR 0348 (decision 2); RFC 9728 (section 2).
 */

/** OAuth 2.0 protected resource metadata. */
export type ProtectedResourceMetadata = {
  /** The resource identifier. */
  readonly resource: string;

  /** The issuers of the authorization servers. */
  readonly authorization_servers: readonly string[];

  /** How a client presents its token: the `Authorization` header only. */
  readonly bearer_methods_supported: readonly ["header"];

  /** The scopes a client may ask for. */
  readonly scopes_supported?: readonly string[];

  /** A human-readable name. */
  readonly resource_name?: string;

  /** A documentation URL. */
  readonly resource_documentation?: string;
};
