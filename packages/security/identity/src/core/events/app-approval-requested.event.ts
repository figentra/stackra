/**
 * Stackra file contract:
 * Purpose: `AppApprovalRequested`, an app approval is waiting for a principal: the notifications module listens and
 *          pushes "approve this sign-in?" to the principal's bound devices. Identity never calls push itself.
 * Boundary: an integration event (`app_approval.requested`, version 1); the sessions module hosts it, so it leaves
 *           as `sessions.app_approval.requested.v1`. Recorded only when the target account exists. Ids, the purpose
 *           and the expiry only: never the number (the user reads it off the requesting screen), the IP or the user
 *           agent (the app fetches those with the pending list). It registers its schema when the module loads
 *           (STA-339 replaces the registration).
 * Runtime: isomorphic
 * Governing contract: STA-1304 (owner request 2026-10-27); ADR 0141; ADR 0305 (rule 19); ADR 0134.
 */
import { Enum, type PublicId } from "@stackra/contracts";
import { IntegrationEvent } from "@stackra/events";
import { publicId, registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { AppApprovalPurpose } from "#contracts/index";

/**
 * One challenge is waiting.
 *
 * @example
 * recordEvent(challenge, AppApprovalRequested.create({ challengeId, principal, purpose, expiresAt }));
 */
export class AppApprovalRequested extends IntegrationEvent({ name: "app_approval.requested" }) {
  /** The challenge. */
  challengeId!: string;

  /** The account asked to approve. */
  principal!: PublicId<"usr">;

  /** Sign-in or step-up. */
  purpose!: AppApprovalPurpose;

  /** When it lapses, ISO 8601; a push after it is dropped. */
  expiresAt!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    AppApprovalRequested,
    z.object({
      challengeId: z.string().min(1),
      principal: publicId("usr"),
      purpose: z.enum(Enum.values(AppApprovalPurpose)),
      expiresAt: z.string(),
    }),
  ],
]);
