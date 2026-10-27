/**
 * Stackra file contract:
 * Purpose: the index route of @figentra/playground: its path and title. The page it renders is `home.tsx` beside
 *          it; gen pairs the two by folder and builds the route tree (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5).
 */
import { Route } from "@stackra/navigation";

/** The index of the playground's pages, at `/`. */
export class HomeRoute extends Route({ path: "/" }) {
  /** The page title. */
  static readonly title = "Stackra Design System";
}
