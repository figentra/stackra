/**
 * Stackra file contract:
 * Purpose: the cart route of @figentra/playground: its path. The page it renders is
 *          `cart.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5); ADR 0503 (module UI kits).
 */
import { Route } from "@stackra/navigation";

/** The Cart page, at `/cart`. */
export class CartRoute extends Route({ path: "/cart" }) {}
