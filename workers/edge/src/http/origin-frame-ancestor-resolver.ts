/**
 * Stackra file contract:
 * Purpose: `originFrameAncestorResolver`: the edge's `FrameAncestorResolver`. It asks the owning product, through the
 *          origin and signed like any forwarded request, `GET /.well-known/stackra/frame-ancestors?path=<path>&host=<host>`,
 *          which answers `{ "origins": [...] }` (Pay: the checkout session tenant's registered embed origins; in preview,
 *          the console of the PR the host names). `host` is the framed page's hostname as the edge matched it (lower case,
 *          no trailing dot), inside the signed target, so the product never reads it from a header a client could set. Each answer
 *          is kept in the isolate for `seconds`, per hostname and path.
 * Boundary: fails closed: a timeout (2 s), a non-200, a body that is not `{ origins: string[] }` or a thrown fetch is
 *           `undefined` (none), and a failure is cached too, so a failing product is not asked on every request. The
 *           cache holds at most 1000 entries, oldest dropped first. `withSecurityHeaders` validates every origin.
 * Runtime: worker
 * Governing contract: ADR 0437 (decision 2: the edge signs what it sends the origin); ADR 0334 rule 12; STA-2562.
 */
import { FRAME_ANCESTORS_PATH } from "#src/http/frame-ancestors-path";
import { signedHeaders } from "#src/http/signed-headers";
import type { EdgeDeps } from "#src/interfaces/edge-deps.interface";
import type { FrameAncestorResolver } from "#src/interfaces/frame-ancestor-resolver.interface";

/** The most answers one isolate keeps. */
const MAX_ENTRIES = 1000;

/** How long the edge waits for the product. */
const TIMEOUT_MS = 2000;

/** The framers of `body`, or undefined when it is not `{ origins: string[] }`. */
const originsOf = (body: unknown): readonly string[] | undefined => {
  const origins = (body as { readonly origins?: unknown } | null)?.origins;
  return Array.isArray(origins) && origins.every((origin) => typeof origin === "string")
    ? origins
    : undefined;
};

/**
 * The origin-backed resolver, with its own isolate cache.
 *
 * @example
 * const resolver = originFrameAncestorResolver(deps, 60);
 * await resolver.resolve(host, "checkout.pay.example", "/c/cs_01"); // ["https://shop.example"]
 */
export function originFrameAncestorResolver(
  deps: Pick<EdgeDeps, "settings" | "secret" | "fetcher" | "now" | "requestId">,
  seconds: number,
): FrameAncestorResolver {
  const cache = new Map<string, { readonly until: number; readonly framers?: readonly string[] }>();
  return {
    async resolve(host, hostname, path) {
      const key = `${hostname} ${path}`;
      const now = deps.now().getTime();
      const kept = cache.get(key);
      if (kept !== undefined && kept.until > now) return kept.framers;
      let framers: readonly string[] | undefined;
      try {
        const framed = hostname.toLowerCase().replace(/\.$/, "");
        const target = `${FRAME_ANCESTORS_PATH}?path=${encodeURIComponent(path)}&host=${encodeURIComponent(framed)}`;
        const headers = await signedHeaders(new Headers(), host, "GET", target, null, deps);
        headers.set("accept", "application/json");
        const response = await deps.fetcher(
          new Request(new URL(target, deps.settings.origin), {
            headers,
            redirect: "manual",
            signal: AbortSignal.timeout(TIMEOUT_MS),
          }),
        );
        framers = response.status === 200 ? originsOf(await response.json()) : undefined;
      } catch {
        framers = undefined;
      }
      cache.delete(key);
      if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
      cache.set(key, {
        until: now + seconds * 1000,
        ...(framers === undefined ? {} : { framers }),
      });
      return framers;
    },
  };
}
