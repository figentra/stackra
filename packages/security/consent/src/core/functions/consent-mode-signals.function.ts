/**
 * Stackra file contract:
 * Purpose: `consentModeSignals`, the Google Consent Mode v2 signals of the current visitor: the three `ad_*` signals
 *          follow `ConsentCategory.Marketing`, `analytics_storage` follows `ConsentCategory.Analytics`.
 * Boundary: a pure read of the `ConsentLedger`; it decides nothing, so Global Privacy Control, the regime and the
 *           stored decision apply exactly as the ledger reads them, and anything not granted is `denied`. It loads no
 *           Google script and calls no `gtag`; the host passes the result on.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 1, 2 and 5); ADR 0294 (decision 16).
 */
import { ConsentCategory } from "#core/enums/consent-category.enum";
import type { ConsentLedger } from "#core/services/consent-ledger.service";
import type { ConsentModeSignals } from "#core/types/consent-mode-signals.type";

/**
 * The Consent Mode v2 signals `ledger` allows now.
 *
 * @example
 * gtag("consent", "update", consentModeSignals(ledger));
 */
export function consentModeSignals(ledger: ConsentLedger): ConsentModeSignals {
  const ads = ledger.isGranted(ConsentCategory.Marketing) ? "granted" : "denied";
  return {
    ad_storage: ads,
    ad_user_data: ads,
    ad_personalization: ads,
    analytics_storage: ledger.isGranted(ConsentCategory.Analytics) ? "granted" : "denied",
  };
}
