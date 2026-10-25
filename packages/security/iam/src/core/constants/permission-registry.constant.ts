/**
 * Stackra file contract:
 * Purpose: `PERMISSION_REGISTRY`, every registered permission by its locked key.
 * Boundary: process-wide and internal: written by `registerPermissions`, read by `permissionKey`, `registerRoles` and
 *           the decision point (which reads `isSystem`). A later row for the same key replaces the earlier one.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 20 and 22).
 */
import type { Permission } from "#core/values/permission.value";

/** Locked key to its `Permission` static. */
export const PERMISSION_REGISTRY = new Map<string, Permission>();
