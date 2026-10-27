/**
 * Stackra file contract:
 * Purpose: `PointsTakenBack`, points of one member taken back (a refunded or cancelled purchase). Leaves through the
 *          host's outbox as `loyalty_kit.points.taken_back.v1`; the balance query's cache is dropped by it.
 * Boundary: an integration event at version 1, recorded on the account by `AccountService.takeBack` only when points
 *           were taken; never below zero, so `shortfall` carries what the member had already spent. It registers its
 *           schema when the module loads (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 5, 16 and 20); ADR 0141 (names and envelope); ADR 0305 (rule 19); ADR 0078
 *                     (outbox); ADR 0454 (decision 4: every balance move is an integration event); STA-1323.
 */
import { IntegrationEvent } from "@stackra/events";
import { Int, registerSchemas } from "@stackra/validation";
import { z } from "zod";

/**
 * One event per take-back reference.
 *
 * @example
 * account.record(PointsTakenBack.create({ memberId, points, shortfall, reference, balanceAfter }));
 */
export class PointsTakenBack extends IntegrationEvent({ name: "points.taken_back" }) {
  /** Points taken off, as a positive number. */
  @Int({ min: 1 })
  points!: number;

  /** Points asked for but not taken, because the member had spent them; zero when all were taken. */
  @Int({ min: 0 })
  shortfall!: number;

  /** The member's balance after the take-back. */
  @Int({ min: 0 })
  balanceAfter!: number;

  /** The member the points were taken from. */
  memberId!: string;

  /** The caller's reference (a refund id), without the kit's prefix. */
  reference!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    PointsTakenBack,
    z.object({
      memberId: z.string(),
      points: z.number().int().min(1),
      shortfall: z.number().int().min(0),
      reference: z.string(),
      balanceAfter: z.number().int().min(0),
    }),
  ],
]);
