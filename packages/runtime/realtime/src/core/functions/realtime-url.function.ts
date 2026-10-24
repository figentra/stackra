/**
 * Stackra file contract:
 * Purpose: `realtimeUrl(target, scheme)`, the address a client transport opens: the realtime origin (or the page's),
 *          `REALTIME_PATH`, and the subscribe token as the `token` parameter, as `ws(s):` for a socket or `http(s):`
 *          for the event stream.
 * Boundary: a pure function over `globalThis.location`; the token goes in the query because a browser socket cannot
 *           send headers, and it is one-time and short-lived for that reason.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1).
 */
import type { RealtimeTarget } from "#contracts/types/realtime-target.type";
import { REALTIME_PATH } from "#core/constants/realtime-path.constant";

/**
 * The URL of `target` in `scheme`.
 *
 * @throws TypeError when the origin is empty and there is no page origin (a native app must set it).
 * @example
 * realtimeUrl({ origin: "https://api.acme.example", token: "t1" }, "ws"); // "wss://api.acme.example/realtime?token=t1"
 */
export function realtimeUrl(target: RealtimeTarget, scheme: "ws" | "http"): string {
  const origin =
    target.origin || (globalThis as { location?: { origin?: string } }).location?.origin;
  if (!origin)
    throw new TypeError(
      "RealtimeConfig.origin is empty and there is no page origin; set it from the env (realtimeOrigin)",
    );
  const url = new URL(REALTIME_PATH, origin);
  url.searchParams.set("token", target.token);
  if (scheme === "ws") url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}
