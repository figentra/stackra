/**
 * Stackra file contract:
 * Purpose: `originOf`, the origin of an absolute URL: how a run's allow-list and each guest `fetch` are compared.
 * Boundary: internal to @stackra/sandbox (not in a barrel); the engines read allow-lists with it, and the pool checks a
 *           relayed request's origin again with it.
 * Runtime: isomorphic
 * Governing contract: ADR 0154 (decision 5); ADR 0434 (decision 2).
 */

/**
 * The origin of `url`.
 *
 * @example
 * originOf("https://api.example.com/a"); // "https://api.example.com"
 * @throws TypeError when `url` is not an absolute URL.
 */
export const originOf = (url: string): string => new URL(url).origin;
