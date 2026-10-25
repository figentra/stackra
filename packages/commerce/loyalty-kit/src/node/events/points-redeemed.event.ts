/**
 * Stackra file contract:
 * Purpose: `PointsRedeemed`, points were debited by a redemption. Private: it never leaves the service; the balance and
 *          points-issued queries' caches are dropped by it.
 * Boundary: a domain event dispatched after commit in process; never in the outbox, never versioned, so it takes no
 *           options and its base is written bare. Recorded by the `debit` step of `RedeemPointsWorkflow`. It registers
 *           its schema when the module loads (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0141 (private events); ADR 0305 (rule 19); ADR 0078
 *                     (decision 3: domain events are not versioned).
 */
import { DomainEvent } from "@stackra/events";
import { Int, registerSchemas } from "@stackra/validation";
import { z } from "zod";

/**
 * Recorded with `ctx.record` by the step that debits.
 *
 * @example
 * ctx.record(PointsRedeemed.create({ memberId, points, reference }));
 */
export class PointsRedeemed extends DomainEvent {
  /** The member debited. */
  memberId!: string;

  /** Points debited, as a positive number. */
  @Int()
  points!: number;

  /** The redemption's reference. */
  reference!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    PointsRedeemed,
    z.object({ memberId: z.string(), points: z.number().int(), reference: z.string() }),
  ],
]);
