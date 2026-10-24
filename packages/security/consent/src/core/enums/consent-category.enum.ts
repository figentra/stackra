/**
 * Stackra file contract:
 * Purpose: `ConsentCategory`, what a visitor or user consents to: the categories a `ConsentConfig` lists, the category
 *          that gates analytics (`AnalyticsConfig.consentCategory`) and session replay (`TelemetryConfig.replay`).
 * Boundary: an `Enum.of` value plus the type of the same name. An app defines no category enum of its own. The codes
 *           are stored in the decision and label the settings switches through the derived key
 *           `consent::enums.consent_category.<code>` (assets/lang). A new category is a new case here and a new label.
 * Runtime: isomorphic
 * Governing contract: ADR 0298; ADR 0294 (decisions 16 and 20: enums and derived keys); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/**
 * The consent categories.
 *
 * @example
 * const analytics = useConsent(ConsentCategory.Analytics);
 */
export const ConsentCategory = Enum.of({
  /** What the surface cannot work without, the decision cookie included; always granted and never asked. */
  Necessary: "necessary",
  /** Product analytics events. */
  Analytics: "analytics",
  /** Session replays recorded around a crash or an error. */
  CrashReplay: "crash_replay",
});

/** One of the codes above. */
export type ConsentCategory = Enum.Value<typeof ConsentCategory>;
