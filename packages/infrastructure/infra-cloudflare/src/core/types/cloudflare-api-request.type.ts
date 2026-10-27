/**
 * Stackra file contract:
 * Purpose: `CloudflareApiRequest`, one call to the Cloudflare v4 API as the request builders describe it: the method,
 *          the path under `https://api.cloudflare.com/client/v4` and the JSON body, in the API's own snake_case keys.
 * Boundary: type only. The caller (the OS tenancy service) sends it with its own token from its secret store; no
 *           token, header or client is part of it.
 * Runtime: isomorphic
 * Governing contract: ADR 0276 (decisions 4 and 8), ADR 0437 (decisions 10 and 12).
 */

/** One Cloudflare API call. */
export type CloudflareApiRequest = {
  /** The HTTP method of the call. */
  readonly method: "GET" | "POST" | "PATCH" | "DELETE";
  /** The API path, such as `/zones/<zone id>/custom_hostnames`. */
  readonly path: string;
  /** The JSON body, for a call that sends one. */
  readonly body?: Readonly<Record<string, unknown>>;
};
