/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/permissions-matrix` (PermissionsMatrix).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** PermissionsMatrix: editable on web, read-only on native. */
export const FREE_PERMISSIONS_MATRIX: ComponentEntry = {
  slug: "permissions-matrix",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "PermissionsMatrix",
  parts: ["PermissionsMatrix"],
  hero: {},
  examples: [
    { id: "store-roles", card: true },
    { id: "single-role" },
    { id: "warehouse" },
    { id: "read-only", platforms: ["react"] },
    { id: "controlled", platforms: ["react"] },
  ],
  related: ["free/checkbox", "free/table", "free/data-table"],
  tokens: ["color.success", "color.border", "color.surface", "motion.duration"],
  keywords: ["roles", "permissions", "access", "rbac", "matrix"],
};
