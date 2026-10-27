/**
 * Stackra file contract:
 * Purpose: `AccessReason`, why the decision point allowed or refused a permission: the reason an `AccessExplanation`
 *          carries into the audit record.
 * Boundary: an `Enum.of` value plus the type of the same name. Codes are snake_case and land in audit records, so a
 *           code never changes. A refusal sent to the caller never carries the reason (no leak of the policy).
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decisions 1 to 3); ADR 0099 (system permissions held by no role); ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/**
 * Why the decision point allowed or refused a permission.
 *
 * @example
 * if (explanation.reason === AccessReason.Denied) audit({ rule: explanation.rule });
 */
export const AccessReason = Enum.of({
  /** A grant that applies where the call acts holds the permission, and no deny matched. */
  Granted: "granted",
  /** The platform itself acts (a system or job actor, or a service acting for no one on a system permission). */
  Platform: "platform",
  /** No grant that applies holds the permission. */
  NotGranted: "not_granted",
  /** An explicit deny matched; it beats the grant. */
  Denied: "denied",
  /** The permission is a system permission, which no role grants and only the platform holds. */
  SystemOnly: "system_only",
  /** No regular grant holds it, but an open break-glass grant does; the audit records the reason. */
  BreakGlass: "break_glass",
});

/** One of the codes above. */
export type AccessReason = Enum.Value<typeof AccessReason>;
