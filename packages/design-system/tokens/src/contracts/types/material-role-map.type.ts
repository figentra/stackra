/**
 * Stackra file contract:
 * Purpose: `MaterialRoleMap`: which level each material role draws in one family, or `solid` for the opaque role
 *          surface.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0320 (decision 1 as amended 2026-10-31); ADR 0501 (tokens v2, the materials block).
 */
import type { MaterialLevel } from "#contracts/enums/material-level.enum";
import type { MaterialRole } from "#contracts/enums/material-role.enum";

/** Which level each role draws, or `solid`. */
export type MaterialRoleMap = { readonly [Role in MaterialRole]: MaterialLevel | "solid" };
