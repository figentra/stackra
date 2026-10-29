/**
 * Stackra file contract:
 * Purpose: `AccountDeletionScheduled`, a user asked to delete their own account: it is deleted at `dueAt` unless they cancel first. A
 *          notifications listener may confirm it to the user ("your account will be deleted on …").
 * Boundary: an integration event (`account_deletion.scheduled`, version 1); the identity module hosts it, so it leaves as
 *           `identity.account_deletion.scheduled.v1`. Ids and times only: never a name, an email or a reason. It registers its schema when
 *           the module loads (STA-339 replaces the registration).
 * Runtime: isomorphic
 * Governing contract: App Store Review Guideline 5.1.1(v); ADR 0141; ADR 0305 (rule 19); STA-1567.
 */
import type { PublicId } from "@stackra/contracts";
import { IntegrationEvent } from "@stackra/events";
import { publicId, registerSchemas } from "@stackra/validation";
import { z } from "zod";

/**
 * A user scheduled their account's deletion.
 *
 * @example
 * await ctx.publish(AccountDeletionScheduled.create({ subject, dueAt: dueAt.toISOString() }));
 */
export class AccountDeletionScheduled extends IntegrationEvent({
  name: "account_deletion.scheduled",
}) {
  /** The account being deleted. */
  subject!: PublicId<"usr">;

  /** When the grace period ends and the erasure may start, ISO 8601. */
  dueAt!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [AccountDeletionScheduled, z.object({ subject: publicId("usr"), dueAt: z.string() })],
]);
