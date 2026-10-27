/**
 * Stackra file contract:
 * Purpose: `routeKey`, the identity of a route: the snake_case of its file stem (`order-detail.route.ts` is
 *          `order_detail`), the key `Routes.<key>` resolves and `registerRoutes` links.
 * Boundary: pure. A route sits in `routes/<name>/<name>.route.ts`, so the stem is its folder's name.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20: widget, block, route); ADR 0297 (decision 4).
 */
import { snakeCase } from "@stackra/support";

/**
 * The key of the route whose class file is `file`.
 *
 * @example
 * routeKey("src/routes/order-detail/order-detail.route.ts"); // "order_detail"
 */
export function routeKey(file: string): string {
  return snakeCase((file.split("/").pop() ?? "").replace(/\.route\.tsx?$/, ""));
}
