/**
 * Stackra file contract:
 * Purpose: `DeviceListQuery`, which registered devices to list: by standing, kind and node, each null for any.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 7); OS 0016 (inventory).
 */
import type { DeviceStatus } from "#contracts/enums/device-status.enum";

/** A registry filter. */
export interface DeviceListQuery {
  /** Only this standing; null for any. */
  readonly status: DeviceStatus | null;

  /** Only this kind; null for any. */
  readonly kind: string | null;

  /** Only devices assigned to this node; null for any. */
  readonly nodeId: string | null;
}
