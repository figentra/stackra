/**
 * Stackra file contract:
 * Purpose: `MembershipLeft`, recorded when a subject leaves a segment: a dynamic segment's condition stopped matching
 *          it (or the subject is gone), or a person removed it from a manual one.
 * Boundary: an integration event, so it leaves through the outbox in the transaction that removed the membership and a
 *           rolled-back change sends none; gen locks its wire name `segments.membership.left.v1`. It names the segment
 *           and the subject, never the facts. It registers this package's own schema when the module loads, so
 *           `MembershipLeft.create` works with no generated file.
 * Runtime: isomorphic
 * Governing contract: ADR 0332 (decision 4); ADR 0141 (2026-10-23 note); ADR 0305 (rule 19); ADR 0294 (decision 27).
 */
import type { PublicId } from "@stackra/contracts";
import { IntegrationEvent } from "@stackra/events";
import { registerSchemas } from "@stackra/validation";

import { MEMBERSHIP_CHANGE_SCHEMA } from "#core/constants/membership-change-schema.constant";

/**
 * One subject left one segment.
 *
 * @example
 * export class EndVipPerksListener extends Listener {
 *   async handle(event: MembershipLeft): Promise<void> { ... }
 * }
 */
export class MembershipLeft extends IntegrationEvent({ name: "membership.left" }) {
  /** The segment left. */
  segmentId!: PublicId<"seg">;

  /** The subject model's key (`commerce.customer`). */
  subjectModel!: string;

  /** The subject's public id. */
  subjectId!: string;
}

registerSchemas([[MembershipLeft, MEMBERSHIP_CHANGE_SCHEMA]]);
