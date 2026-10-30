/**
 * Stackra file contract:
 * Purpose: the permissions matrix route of @figentra/playground: its path. The page it renders is
 *          `permissions-matrix.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5).
 */
import { Route } from "@stackra/navigation";

/** The Permissions matrix page, at `/permissions-matrix`. */
export class PermissionsMatrixRoute extends Route({ path: "/permissions-matrix" }) {}
