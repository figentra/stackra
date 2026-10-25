/**
 * Stackra file contract:
 * Purpose: `EscalationStep`, one step of an escalation: how long after the first send without an acknowledgement it
 *          runs, who it goes to and on which channels.
 * Boundary: a type only; the steps are rules data (`rule-set:<product>:escalation`, OS-199), the targets opaque to this
 *           package (a role, a person's public id) and resolved by the caller.
 * Runtime: isomorphic
 * Governing contract: OS-199; row "acknowledgement and escalation" of the package needs (2026-10-25).
 */
import type { NotificationChannel } from "#contracts/enums/notification-channel.enum";

/** One escalation step. */
export interface EscalationStep {
  /** Seconds after the first send. */
  readonly afterSeconds: number;

  /** Who hears it, as the rule names them. */
  readonly targets: readonly string[];

  /** The channels it goes on. */
  readonly channels: readonly NotificationChannel[];
}
