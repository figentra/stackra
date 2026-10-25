/**
 * Stackra file contract:
 * Purpose: `protectedResourceMetadata`, the RFC 9728 document the hosted MCP endpoint serves at
 *          `/.well-known/oauth-protected-resource`: its resource URL, the identity provider's issuer as the
 *          authorization server, bearer tokens in the header only, and the optional scopes, name and documentation.
 * Boundary: pure; every value comes from the host's options. It refuses a resource or issuer that is not an absolute
 *           https URL (http only on a loopback host, for local runs) and a resource with a fragment.
 * Runtime: isomorphic
 * Governing contract: ADR 0348 (decision 2); ADR 0155 (decision 4: OAuth through the identity provider); RFC 9728.
 */
import type { ProtectedResourceMetadata } from "#core/types/protected-resource-metadata.type";
import type { ProtectedResourceOptions } from "#core/types/protected-resource-options.type";

/** Loopback hosts, where plain http is allowed for local runs. */
const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * Throws unless `value` is an absolute https URL (or http on a loopback host) without a fragment.
 *
 * @param field - the option name, for the message.
 * @param value - the URL.
 */
function checkUrl(field: string, value: string): void {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new RangeError(`protectedResourceMetadata: ${field} is not an absolute URL: ${value}`);
  }
  const secure =
    url.protocol === "https:" || (url.protocol === "http:" && LOOPBACK.has(url.hostname));
  if (!secure)
    throw new RangeError(
      `protectedResourceMetadata: ${field} must use https (http only on a loopback host): ${value}`,
    );
  if (url.hash !== "")
    throw new RangeError(`protectedResourceMetadata: ${field} must not carry a fragment: ${value}`);
}

/**
 * The protected-resource metadata of one hosted MCP endpoint.
 *
 * @param options - the endpoint URL and the authorization servers, from the host's configuration.
 * @throws RangeError on a URL that is not https, has a fragment, or on an empty `authorizationServers`.
 * @example
 * protectedResourceMetadata({ resource: "https://mcp.example.test/mcp", authorizationServers: ["https://id.example.test"] });
 * // { resource: "https://mcp.example.test/mcp", authorization_servers: ["https://id.example.test"], bearer_methods_supported: ["header"] }
 */
export function protectedResourceMetadata(
  options: ProtectedResourceOptions,
): ProtectedResourceMetadata {
  checkUrl("resource", options.resource);
  if (options.authorizationServers.length === 0)
    throw new RangeError("protectedResourceMetadata: authorizationServers names no issuer");
  for (const issuer of options.authorizationServers) checkUrl("authorizationServers", issuer);
  if (options.documentation !== undefined) checkUrl("documentation", options.documentation);
  return {
    resource: options.resource,
    authorization_servers: [...options.authorizationServers],
    bearer_methods_supported: ["header"],
    ...(options.scopes !== undefined && options.scopes.length > 0
      ? { scopes_supported: [...options.scopes] }
      : {}),
    ...(options.name !== undefined ? { resource_name: options.name } : {}),
    ...(options.documentation !== undefined
      ? { resource_documentation: options.documentation }
      : {}),
  };
}
