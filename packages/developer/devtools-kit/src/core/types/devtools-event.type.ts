/**
 * Stackra file contract:
 * Purpose: `DevtoolsEvent`, one entry of the kit's stream: what a package emitted, or what the bus delivered, with
 *          its channel, sequence number and time.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0246 (decisions 2 and 3).
 */

/** One stream entry, frozen. */
export interface DevtoolsEvent {
  /** Increases by one per entry for the life of the kit, so a host spots a gap after replay. */
  readonly sequence: number;

  /** The channel it was emitted on (`DEVTOOLS_BUS_CHANNEL` for the bus timeline). */
  readonly channel: string;

  /** What was emitted. */
  readonly payload: unknown;

  /** When the kit received it, from the Clock port. */
  readonly at: Date;
}
