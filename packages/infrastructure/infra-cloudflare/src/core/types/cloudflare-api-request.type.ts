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
  readonly method: "GET" | "POST" | "PATCH" | "DELETE";
  /** `/zones/<zone id>/custom_hostnames`. */
  readonly path: string;
  readonly body?: Readonly<Record<string, unknown>>;
};
