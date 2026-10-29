/**
 * Stackra file contract:
 * Purpose: `AccountDeletionStarted`, the grace period of an account deletion ended and its erasure started: `EraseSubjectAction` is
 *          queued under `erasureId`, whose `SubjectErased` ends the provider sessions and removes the provider user.
 * Boundary: an integration event (`account_deletion.started`, version 1); the identity module hosts it, so it leaves as
 *           `identity.account_deletion.started.v1`. Ids and times only: never a name, an email or a reason. It registers its schema when
 *           the module loads (STA-339 replaces the registration).
 * Runtime: isomorphic
 * Governing contract: App Store Review Guideline 5.1.1(v); ADR 0141; ADR 0305 (rule 19); STA-1567.
 */
import type { PublicId } from "@stackra/contracts";
import { IntegrationEvent } from "@stackra/events";
import { publicId, registerSchemas } from "@stackra/validation";
import { z } from "zod";

/**
 * An account's erasure started.
 *
 * @example
 * await ctx.publish(AccountDeletionStarted.create({ subject, erasureId }));
 */
export class AccountDeletionStarted extends IntegrationEvent({ name: "account_deletion.started" }) {
  /** The account being deleted. */
  subject!: PublicId<"usr">;

  /** The erasure's id, which its receipt (`SubjectErased`) carries. */
  erasureId!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [AccountDeletionStarted, z.object({ subject: publicId("usr"), erasureId: z.string().min(1) })],
]);
