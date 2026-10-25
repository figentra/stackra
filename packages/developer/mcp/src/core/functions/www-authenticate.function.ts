/**
 * Stackra file contract:
 * Purpose: `wwwAuthenticate`, the `WWW-Authenticate` header the hosted MCP endpoint sends with a 401 (no token) or a
 *          403 (a token without the scope): a `Bearer` challenge naming the protected-resource metadata URL, so an MCP
 *          client finds the authorization server, and the RFC 6750 error and scope when given.
 * Boundary: pure; it quotes each value and refuses one with a quote or a line break, which would break the header.
 * Runtime: isomorphic
 * Governing contract: ADR 0348 (decision 2); RFC 9728 (section 5.1); RFC 6750 (section 3).
 */

/**
 * The `WWW-Authenticate` value of a refused MCP request.
 *
 * @param metadataUrl - where `protectedResourceMetadata` is served.
 * @param challenge - the RFC 6750 `error` (`invalid_token`, `insufficient_scope`) and the `scope` needed.
 * @throws RangeError when a value holds a double quote, a backslash or a line break.
 * @example
 * wwwAuthenticate("https://mcp.example.test/.well-known/oauth-protected-resource");
 * // 'Bearer resource_metadata="https://mcp.example.test/.well-known/oauth-protected-resource"'
 */
export function wwwAuthenticate(
  metadataUrl: string,
  challenge: { readonly error?: string; readonly scope?: string } = {},
): string {
  const parts: [string, string | undefined][] = [
    ["resource_metadata", metadataUrl],
    ["error", challenge.error],
    ["scope", challenge.scope],
  ];
  return `Bearer ${parts
    .filter((part): part is [string, string] => part[1] !== undefined)
    .map(([key, value]) => {
      if (/["\\\r\n]/.test(value))
        throw new RangeError(`wwwAuthenticate: ${key} holds a character a header cannot quote`);
      return `${key}="${value}"`;
    })
    .join(", ")}`;
}
