/**
 * Stackra file contract:
 * Purpose: `PointsExpired`, points of one member expired at the window's cutoff. Leaves through the host's outbox as
 *          `loyalty_kit.points.expired.v1`; the balance and points-issued queries' caches are dropped by it.
 * Boundary: an integration event at version 1, recorded on the account by `ExpirePointsAction` only when an expiry
 *           took points (each driver cuts it at zero, so a spent earn expires nothing and records nothing). It
 *           registers its schema when the module loads (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 5, 16 and 20); ADR 0141 (names and envelope); ADR 0305 (rule 19); ADR 0078
 *                     (outbox); ADR 0454 (decision 4).
 */
import { IntegrationEvent } from "@stackra/events";
import { Int, registerSchemas } from "@stackra/validation";
import { z } from "zod";

/**
 * One event per member per expiry run.
 *
 * @example
 * account.record(PointsExpired.create({ memberId, points, cutoff: cutoff.toISOString(), balanceAfter }));
 */
export class PointsExpired extends IntegrationEvent({ name: "points.expired" }) {
  /** Points taken off, as a positive number. */
  @Int({ min: 1 })
  points!: number;

  /** The member's balance after the expiry. */
  @Int({ min: 0 })
  balanceAfter!: number;

  /** The member whose points expired. */
  memberId!: string;

  /** Points earned before this instant (ISO 8601) were expired. */
  cutoff!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    PointsExpired,
    z.object({
      memberId: z.string(),
      points: z.number().int().min(1),
      cutoff: z.string(),
      balanceAfter: z.number().int().min(0),
    }),
  ],
]);
