/**
 * Stackra file contract:
 * Purpose: `requestOf(input, init?)`, the `Request` of one route run in a test: `input.url` (default
 *          `http://localhost/`), with `input.path` resolved against it and `input.search` added to its query.
 * Boundary: internal to `./testing` (not exported); builds the request only.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3).
 */
import type { RouteLoaderInput } from "#testing/types/route-loader-input.type";

/**
 * The request `input` describes.
 *
 * @example
 * requestOf({ path: "/sign-in", search: { returnTo: "/settings" } }).url; // "http://localhost/sign-in?returnTo=%2Fsettings"
 */
export function requestOf(input: RouteLoaderInput, init?: RequestInit): Request {
  const base = input.url ?? "http://localhost/";
  const url = input.path === undefined ? new URL(base) : new URL(input.path, base);
  for (const [name, value] of Object.entries(input.search ?? {})) url.searchParams.set(name, value);
  return new Request(url, init);
}
