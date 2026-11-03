/**
 * Stackra file contract:
 * Purpose: `ROUTE_TITLE_TABLE`, the default title key gen derives for each route key that writes no `title`
 *          (`order_detail` is `web::routes.order_detail.title`), which `resolveMenuItems` shows before the raw key.
 * Boundary: internal process state, written only by `registerRoutes` from a table entry's `title`. A route class that
 *           sets its own `title` wins over it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20: i18n default keys); STA-2058.
 */

/** Route key → its derived title key. */
export const ROUTE_TITLE_TABLE = new Map<string, string>();
