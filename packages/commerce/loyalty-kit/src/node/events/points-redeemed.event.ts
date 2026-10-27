/**
 * Stackra file contract:
 * Purpose: `PointsRedeemed`, points were debited by a redemption. Leaves through the host's outbox as
 *          `loyalty_kit.points.redeemed.v1`; the balance and points-issued queries' caches are dropped by it.
 * Boundary: an integration event at version 1 (ADR 0454 decision 4: it was a private domain event, so a host could not
 *           follow a redemption): typed fields, built only with `PointsRedeemed.create`, recorded by the `debit` step
 *           of `RedeemPointsWorkflow` when that step commits. A breaking change adds `version: 2` and a change file
 *           beside this one. It registers its schema when the module loads (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 5, 16 and 20); ADR 0141 (names and envelope); ADR 0305 (rule 19); ADR 0078
 *                     (outbox); ADR 0454 (decision 4).
 */
import { IntegrationEvent } from "@stackra/events";
import { Int, registerSchemas } from "@stackra/validation";
import { z } from "zod";

/**
 * Recorded with `ctx.record` by the step that debits.
 *
 * @example
 * ctx.record(PointsRedeemed.create({ memberId, points, reference, balanceAfter }));
 */
export class PointsRedeemed extends IntegrationEvent({ name: "points.redeemed" }) {
  /** Points debited, as a positive number. */
  @Int({ min: 1 })
  points!: number;

  /** The member's balance after the debit, so a consumer needs no second call. */
  @Int({ min: 0 })
  balanceAfter!: number;

  /** The member debited. */
  memberId!: string;

  /** The redemption's reference. */
  reference!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    PointsRedeemed,
    z.object({
      memberId: z.string(),
      points: z.number().int().min(1),
      reference: z.string(),
      balanceAfter: z.number().int().min(0),
    }),
  ],
]);
