/**
 * Stackra file contract:
 * Purpose: the sign-in route of @figentra/playground: its path. The page it renders is
 *          `sign-in.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5); ADR 0504 (module UI kits).
 */
import { Route } from "@stackra/navigation";

/** The SignIn page, at `/sign-in`. */
export class SignInRoute extends Route({ path: "/sign-in" }) {}
