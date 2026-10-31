/**
 * Stackra file contract:
 * Purpose: `materialRoleLevel(materials, family, role)`: the level a role draws in a family, the theme's override
 *          first, then `MATERIAL_FAMILY_ROLES`. Web (`renderWebCss`) and native (`useGlassMaterial`) both ask it, so
 *          the two agree.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0320 (decision 1 as amended 2026-10-31); ADR 0501 (tokens v2, the materials block).
 */
import type { MaterialFamily } from "#contracts/enums/material-family.enum";
import type { MaterialLevel } from "#contracts/enums/material-level.enum";
import type { MaterialRole } from "#contracts/enums/material-role.enum";
import type { ThemeMaterials } from "#contracts/types/theme-materials.type";
import { MATERIAL_FAMILY_ROLES } from "#core/constants/material-family-roles.constant";

/** The level `role` draws in `family`, or `solid`. */
export function materialRoleLevel(
  materials: Pick<ThemeMaterials, "roles"> | undefined,
  family: MaterialFamily,
  role: MaterialRole,
): MaterialLevel | "solid" {
  return materials?.roles?.[family]?.[role] ?? MATERIAL_FAMILY_ROLES[family][role];
}
