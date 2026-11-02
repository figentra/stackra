/**
 * Stackra file contract:
 * Purpose: `DeviceSession`, one of the signed-in user's sessions as the SecurityPage lists it: the device, where it was
 *          last seen, when it was last active and whether it is this one.
 * Boundary: a type only. `device` and `location` are display text the server writes; the page shows them as given.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (client ports); ADR 0338 (decision 4: ending a device's session).
 */

/**
 * A device session.
 *
 * @example
 * const session: DeviceSession = { id: "ses_1", device: "Safari on macOS", location: "Riyadh", lastActiveAt, isCurrent: true };
 */
export interface DeviceSession {
  /** The session's id. */
  readonly id: string;

  /** The device and browser or app, for example "Safari on macOS". */
  readonly device: string;

  /** Where it was last seen, when known. */
  readonly location: string | null;

  /** When it was last active. */
  readonly lastActiveAt: Date;

  /** True for the session this page runs in. */
  readonly isCurrent: boolean;
}
