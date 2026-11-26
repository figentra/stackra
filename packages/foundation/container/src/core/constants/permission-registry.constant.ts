/**
 * Stackra file contract:
 * Purpose: `PERMISSION_REGISTRY`, every registered permission by its locked key.
 * Boundary: process-wide and internal: written by `registerPermissions`, read by `permissionKey`, `registerRoles` and
 *           the decision point (which reads `isSystem`). A later row for the same key replaces the earlier one. It lives
 *           on `globalThis` under a `Symbol.for` key, so two installed copies of this package share it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 20 and 22).
 */
import type { Permission } from "@stackra/contracts";

/** The process-wide key every copy of this package reads the registry from. */
const KEY = Symbol.for("@stackra/container/permission-registry");

/** Locked key to its `Permission` static. */
export const PERMISSION_REGISTRY = ((globalThis as Record<symbol, unknown>)[KEY] ??= new Map<
  string,
  Permission
>()) as Map<string, Permission>;
