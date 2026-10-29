/**
 * Stackra file contract:
 * Purpose: `AccountDeletionCancelled`, the user cancelled their account's deletion within the grace period; the account stays.
 * Boundary: an integration event (`account_deletion.cancelled`, version 1); the identity module hosts it, so it leaves as
 *           `identity.account_deletion.cancelled.v1`. Ids and times only: never a name, an email or a reason. It registers its schema when
 *           the module loads (STA-339 replaces the registration).
 * Runtime: isomorphic
 * Governing contract: App Store Review Guideline 5.1.1(v); ADR 0141; ADR 0305 (rule 19); STA-1567.
 */
import type { PublicId } from "@stackra/contracts";
import { IntegrationEvent } from "@stackra/events";
import { publicId, registerSchemas } from "@stackra/validation";
import { z } from "zod";

/**
 * A user kept their account.
 *
 * @example
 * await ctx.publish(AccountDeletionCancelled.create({ subject, at: ctx.now().toISOString() }));
 */
export class AccountDeletionCancelled extends IntegrationEvent({
  name: "account_deletion.cancelled",
}) {
  /** The account being deleted. */
  subject!: PublicId<"usr">;

  /** When it was cancelled, ISO 8601. */
  at!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [AccountDeletionCancelled, z.object({ subject: publicId("usr"), at: z.string() })],
]);
