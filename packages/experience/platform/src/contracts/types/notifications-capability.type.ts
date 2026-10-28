/**
 * Stackra file contract:
 * Purpose: `NotificationsCapability`, the `notifications` facet (capability `local_notifications`): ask for the
 *          permission and show a notification while the app runs (ADR 0255 decision 3). Remote push is the
 *          `PlatformPushTransport` port.
 * Boundary: a type only. Both calls resolve a `CapabilityResult`: a target without notifications or a refused
 *           permission is a typed refusal, never an exception.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decisions 2 and 3); ADR 0255 (decision 3).
 */
import type { CapabilityResult } from "#contracts/types/capability-result.type";
import type { PermissionStatus } from "#contracts/types/permission-status.type";

/** The local notifications capability. */
export interface NotificationsCapability {
  /** Where the notification permission stands now. */
  readonly permission: PermissionStatus;

  /** Asks for the permission when it is not decided; refuses with `permission_denied` when it ends up denied. */
  requestPermission(): Promise<CapabilityResult>;

  /** Shows a notification; refuses unless the permission is granted. */
  notify(
    title: string,
    options?: { readonly body?: string; readonly tag?: string },
  ): Promise<CapabilityResult>;
}
