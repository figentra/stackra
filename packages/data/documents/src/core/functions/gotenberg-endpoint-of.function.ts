/**
 * Stackra file contract:
 * Purpose: `gotenbergEndpointOf`, the `GotenbergEndpoint` a `DocumentsConfig` names: its URL, its timeout and, when
 *          the secret is set, the `authorization` header.
 * Boundary: pure; reads the config only. An empty secret sends no header.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 2); ADR 0294 (decision 17: the drivers inject the config class); STA-344.
 */
import type { DocumentsConfig } from "#config/documents.config";
import type { GotenbergEndpoint } from "#core/types/gotenberg-endpoint.type";

/**
 * Where the `gotenberg` drivers reach the engine.
 *
 * @example
 * const endpoint = gotenbergEndpointOf(config); // { url, timeoutMs, headers: { authorization } }
 */
export function gotenbergEndpointOf(config: DocumentsConfig): GotenbergEndpoint {
  return {
    url: config.gotenbergUrl,
    timeoutMs: config.gotenbergTimeoutMs,
    headers:
      config.gotenbergAuthorization === "" ? {} : { authorization: config.gotenbergAuthorization },
  };
}
