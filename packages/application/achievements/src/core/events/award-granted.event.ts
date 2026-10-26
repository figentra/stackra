/**
 * Stackra file contract:
 * Purpose: `AwardGranted`, recorded when an award is granted to a recipient, by a person or by its kind's criteria.
 * Boundary: an integration event, so it leaves through the outbox in the transaction that wrote the award and a
 *           rolled-back grant sends none; gen locks its wire name `achievements.award.granted.v1`. It names the award,
 *           the kind and the recipient, never the reason or the facts that matched. It registers this package's own
 *           schema when the module loads, so `AwardGranted.create` works with no generated file.
 * Runtime: isomorphic
 * Governing contract: ADR 0368 (decision 7); ADR 0141 (2026-10-23 note); ADR 0305 (rule 19); ADR 0294 (decision 27).
 */
import type { PublicId } from "@stackra/contracts";
import { IntegrationEvent } from "@stackra/events";
import { registerSchemas } from "@stackra/validation";

import { AWARD_GRANTED_SCHEMA } from "#core/constants/award-granted-schema.constant";

/**
 * One award granted.
 *
 * @example
 * export class CongratulateListener extends Listener {
 *   async handle(event: AwardGranted): Promise<void> { ... }
 * }
 */
export class AwardGranted extends IntegrationEvent({ name: "award.granted" }) {
  /** The id of the award. */
  awardId!: PublicId<"awd">;

  /** The kind of the award. */
  kindId!: PublicId<"awk">;

  /** The recipient model's key (`workforce.member`). */
  recipientModel!: string;

  /** The recipient's public id. */
  recipientId!: string;

  /** The level granted; null for a kind with no levels. */
  level!: string | null;

  /** The period granted for; null for a kind that is not once per period. */
  period!: string | null;
}

registerSchemas([[AwardGranted, AWARD_GRANTED_SCHEMA]]);
