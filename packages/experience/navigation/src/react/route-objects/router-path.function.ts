/**
 * Stackra file contract:
 * Purpose: `routerPath(path)`, a route class's absolute path as a nested React Router route takes it: `/` is the index
 *          of its layout, `/quick-order` becomes `quick-order` (relative, so the tree mounts under every locale prefix),
 *          `*` stays the catch-all, no path is a pathless route.
 * Boundary: internal to the data-router builders.
 * Runtime: isomorphic
 * Governing contract: ADR 0165 (React Router 7); ADR 0297 (decision 4: one tree per locale prefix).
 */

/**
 * The router path props of `path`.
 *
 * @example
 * routerPath("/store/:slug"); // { path: "store/:slug" }
 */
export function routerPath(
  path: unknown,
): { index: true } | { path: string } | Record<string, never> {
  if (typeof path !== "string") return {};
  if (path === "/") return { index: true };
  return { path: path.replace(/^\/+/, "") };
}
