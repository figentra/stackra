/**
 * Stackra file contract:
 * Purpose: the home route of @figentra/{{NAME}}: its path. The page it renders is `home.tsx` beside it; gen pairs
 *          the two by folder and builds the route tree (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading yet.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7).
 */
import { Route } from "@stackra/navigation";

/** The panel's landing page, at `/`. */
export class HomeRoute extends Route({ path: "/" }) {}
