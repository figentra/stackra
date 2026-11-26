/**
 * Stackra file contract:
 * Purpose: `AutomationQuotaAnswer`, what `AutomationQuota.check` says about one more run of a tenant's automation:
 *          allowed, over the tenant's quota, or unknown because the quota could not be read.
 * Boundary: an `Enum.of` value plus the type of the same name. `unavailable` fails closed: no run starts on it.
 * Runtime: isomorphic
 * Governing contract: ADR 0122 (decision 3); ADR 0153 (decision 2); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/**
 * The answers of a quota check.
 * @example
 * if ((await quota.check(scope, automationId)) !== AutomationQuotaAnswer.Allow) return;
 */
export const AutomationQuotaAnswer = Enum.of({
  /** The run may start. */
  Allow: "allow",
  /** The tenant used up its quota, or its plan does not sell automation runs. */
  Exceeded: "exceeded",
  /** The quota could not be read (never synced, or the quota service did not answer). */
  Unavailable: "unavailable",
});

/** One of the codes above. */
export type AutomationQuotaAnswer = Enum.Value<typeof AutomationQuotaAnswer>;
