/**
 * Stackra file contract:
 * Purpose: `SupportSettings`, the example settings group of the "Settings and feature flags" guide (key `support`):
 *          how many hours agents have to answer a new ticket, and whether a resolved ticket asks for a rating. The
 *          platform sets the defaults; each tenant may change both for itself.
 * Boundary: the declaration only, as an app's `src/modules/support/support.settings.ts` would hold it; gen writes the
 *           group's schema, the settings page, its operations, permissions and labels from it. Never a secret.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (settings per scope); ADR 0307 (rules 22 to 24); ADR 0323 (the tenant level is
 *                     tenancy's); STA-2852.
 */
import { Setting, SettingScope, Settings } from "@stackra/settings";
import { TenancyScopes } from "@stackra/tenancy";
import { Int } from "@stackra/validation";

/** The support module's runtime values. */
export class SupportSettings extends Settings({
  scopes: [SettingScope.Platform, TenancyScopes.Tenant],
}) {
  /** Hours an agent has to answer a new ticket. */
  @Int({
    min: 1,
    max: 168,
  })
  @Setting()
  firstReplyHours = 24;

  /** Whether a resolved ticket asks the customer to rate the answer; the apps read it too. */
  @Setting({ client: true })
  surveysEnabled = true;
}
