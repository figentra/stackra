/**
 * Stackra file contract:
 * Purpose: `AwardRevoked`, recorded when an award is revoked; its verify token stops resolving in the same transaction.
 * Boundary: an integration event, so it leaves through the outbox in the transaction that revoked the award; gen locks
 *           its wire name `achievements.award.revoked.v1`. It never carries the revoke reason. It registers this
 *           package's own schema when the module loads.
 * Runtime: isomorphic
 * Governing contract: ADR 0368 (decisions 5 and 7); ADR 0141 (2026-10-23 note); ADR 0305 (rule 19).
 */
import type { PublicId } from "@stackra/contracts";
import { IntegrationEvent } from "@stackra/events";
import { registerSchemas } from "@stackra/validation";

import { AWARD_REVOKED_SCHEMA } from "#core/constants/award-revoked-schema.constant";

/**
 * One award revoked.
 *
 * @example
 * export class WithdrawBadgeListener extends Listener {
 *   async handle(event: AwardRevoked): Promise<void> { ... }
 * }
 */
export class AwardRevoked extends IntegrationEvent({ name: "award.revoked" }) {
  /** The award. */
  awardId!: PublicId<"awd">;

  /** Its kind. */
  kindId!: PublicId<"awk">;

  /** The recipient model's key (`workforce.member`). */
  recipientModel!: string;

  /** The recipient's public id. */
  recipientId!: string;
}

registerSchemas([[AwardRevoked, AWARD_REVOKED_SCHEMA]]);
