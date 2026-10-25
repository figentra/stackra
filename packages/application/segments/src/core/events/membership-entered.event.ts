/**
 * Stackra file contract:
 * Purpose: `MembershipEntered`, recorded when a subject joins a segment: a dynamic segment's condition started to match
 *          it, or a person added it to a manual one.
 * Boundary: an integration event, so it leaves through the outbox in the transaction that wrote the membership and a
 *           rolled-back change sends none; gen locks its wire name `segments.membership.entered.v1`. It names the
 *           segment and the subject, never the facts that matched. It registers this package's own schema when the
 *           module loads, so `MembershipEntered.create` works with no generated file.
 * Runtime: isomorphic
 * Governing contract: ADR 0332 (decision 4); ADR 0141 (2026-10-23 note); ADR 0305 (rule 19); ADR 0294 (decision 27).
 */
import type { PublicId } from "@stackra/contracts";
import { IntegrationEvent } from "@stackra/events";
import { registerSchemas } from "@stackra/validation";

import { MEMBERSHIP_CHANGE_SCHEMA } from "#core/constants/membership-change-schema.constant";

/**
 * One subject joined one segment.
 *
 * @example
 * export class WelcomeVipListener extends Listener {
 *   async handle(event: MembershipEntered): Promise<void> { ... }
 * }
 */
export class MembershipEntered extends IntegrationEvent({ name: "membership.entered" }) {
  /** The segment joined. */
  segmentId!: PublicId<"seg">;

  /** The subject model's key (`commerce.customer`). */
  subjectModel!: string;

  /** The subject's public id. */
  subjectId!: string;
}

registerSchemas([[MembershipEntered, MEMBERSHIP_CHANGE_SCHEMA]]);
