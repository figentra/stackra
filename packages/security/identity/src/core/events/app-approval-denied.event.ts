/**
 * Stackra file contract:
 * Purpose: `AppApprovalDenied`, a principal denied an app approval, or picked a number that did not match: the audit
 *          trail and the security notices listen (a wrong number may be someone else's request).
 * Boundary: an integration event (`app_approval.denied`, version 1), leaving as `sessions.app_approval.denied.v1` from
 *           the sessions module that hosts it. Ids, the purpose, why, the answering device and the time only. It
 *           registers its schema when the module loads (STA-339 replaces the registration).
 * Runtime: isomorphic
 * Governing contract: STA-1304 (owner request 2026-10-27); ADR 0141; ADR 0305 (rule 19).
 */
import { Enum, type PublicId } from "@stackra/contracts";
import { IntegrationEvent } from "@stackra/events";
import { Field, publicId, registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { AppApprovalPurpose } from "#contracts/index";

/**
 * One challenge denied.
 *
 * @example
 * recordEvent(denied, AppApprovalDenied.create({ challengeId, principal, purpose, reason: "denied", device, at }));
 */
export class AppApprovalDenied extends IntegrationEvent({ name: "app_approval.denied" }) {
  /** `denied` by the user, or `number_mismatch` when the picked number was not the shown one. */
  // reason: a two-value wire field kept as a string-literal union so the event payload stays as published
  @Field(z.enum(["denied", "number_mismatch"]))
  reason!: "denied" | "number_mismatch";

  /** The app approval challenge this event is about. */
  challengeId!: string;

  /** The account that answered. */
  principal!: PublicId<"usr">;

  /** Sign-in or step-up. */
  purpose!: AppApprovalPurpose;

  /** The answering device. */
  device!: string;

  /** When, ISO 8601. */
  at!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    AppApprovalDenied,
    z.object({
      challengeId: z.string().min(1),
      principal: publicId("usr"),
      purpose: z.enum(Enum.values(AppApprovalPurpose)),
      reason: z.enum(["denied", "number_mismatch"]),
      device: z.string().min(1),
      at: z.string(),
    }),
  ],
]);
