/**
 * Stackra file contract:
 * Purpose: `DevicePermissionStatus`, where a device permission stands: granted, denied (asking again shows the
 *          prompt), blocked (the OS will not prompt again, only its settings page can grant it), or not asked yet.
 * Boundary: a type only; `PermissionStatus` plus `blocked`.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decision 2, 2026-10-29 note).
 */
import type { PermissionStatus } from "#contracts/types/permission-status.type";

/** A device permission: granted, denied, blocked (settings only), or still to be asked. */
export type DevicePermissionStatus = PermissionStatus | "blocked";
