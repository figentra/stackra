/**
 * Stackra file contract:
 * Purpose: `RenderMode`, where a web page renders: on the server per request, or in the browser after the server sent
 *          the head and the route's fallback (`defineApp({ render })`, `Route({ render })`).
 * Boundary: codes only; prerendering is the route's `prerender` flag, not a mode.
 * Runtime: isomorphic
 * Governing contract: ADR 0297 (web runtime on Workers); ADR 0165 (React Router 7 framework mode); ADR 0128.
 */
import { Enum } from "@stackra/contracts";

/** The render modes of a web page. */
export const RenderMode = Enum.of({
  /** Rendered on the server for each request. */
  Server: "server",
  /** The head on the server, the page in the browser after the route's fallback. */
  Client: "client",
});

/** One of the codes above. */
export type RenderMode = Enum.Value<typeof RenderMode>;
