/**
 * Stackra file contract:
 * Purpose: `AppApprovalApproved`, a principal approved an app approval on a bound device: the audit trail and the
 *          security notices ("you signed in on a new device") listen.
 * Boundary: an integration event (`app_approval.approved`, version 1), leaving as `sessions.app_approval.approved.v1`
 *           from the sessions module that hosts it. Ids, the purpose, the approving device and the time only. It
 *           registers its schema when the module loads (STA-339 replaces the registration).
 * Runtime: isomorphic
 * Governing contract: STA-1304 (owner request 2026-10-27); ADR 0141; ADR 0305 (rule 19).
 */
import { Enum, type PublicId } from "@stackra/contracts";
import { IntegrationEvent } from "@stackra/events";
import { publicId, registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { AppApprovalPurpose } from "#contracts/index";

/**
 * One challenge approved.
 *
 * @example
 * recordEvent(approved, AppApprovalApproved.create({ challengeId, principal, purpose, device, at }));
 */
export class AppApprovalApproved extends IntegrationEvent({ name: "app_approval.approved" }) {
  /** The challenge. */
  challengeId!: string;

  /** The account that approved. */
  principal!: PublicId<"usr">;

  /** Sign-in or step-up. */
  purpose!: AppApprovalPurpose;

  /** The approving device. */
  device!: string;

  /** When, ISO 8601. */
  at!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    AppApprovalApproved,
    z.object({
      challengeId: z.string().min(1),
      principal: publicId("usr"),
      purpose: z.enum(Enum.values(AppApprovalPurpose)),
      device: z.string().min(1),
      at: z.string(),
    }),
  ],
]);
