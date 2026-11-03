/**
 * Stackra file contract:
 * Purpose: `routeTitleKey`, the default title of a route that writes none: the i18n key
 *          `<module>::routes.<snake(stem)>.title` (`order-detail.route.ts` of module `web` is
 *          `web::routes.order_detail.title`), which menus show instead of the raw route key.
 * Boundary: pure. Whether the key exists in a catalogue is not checked here.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20: i18n default keys `<module>::<kind>.<name>.<part>`); STA-2058.
 */
import { routeKey } from "#core/functions/route-key.function";

/**
 * The derived title key of the route whose class file is `file` in `module`.
 *
 * @example
 * routeTitleKey("web", "src/routes/order-detail/order-detail.route.ts"); // "web::routes.order_detail.title"
 */
export function routeTitleKey(module: string, file: string): string {
  return `${module}::routes.${routeKey(file)}.title`;
}
