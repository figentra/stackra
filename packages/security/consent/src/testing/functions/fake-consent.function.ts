/**
 * Stackra file contract:
 * Purpose: `fakeConsent(configure)`, the consent a test starts from: a real `ConsentLedger` over the package's default
 *          configuration and an in-memory store, handed to a render helper (`renderRoute(..., { consent })`) or bound
 *          in place of `ConsentLedger`; the test reads what the code under test decided through it.
 * Boundary: test code only. Nothing is decided at first (decline by default): only `necessary` is granted. It is the
 *           real ledger, not a mock, so the policy version, expiry and Global Privacy Control rules behave as in the
 *           app; two calls never share state.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3: domain helpers in the owning package's ./testing); ADR 0266; ADR 0298.
 */
import { buildConfig } from "@stackra/config";

import { ConsentConfig, ConsentLedger, MemoryConsentStoreDriver } from "#core/index";

/**
 * A fresh consent ledger with nothing decided, after `configure` has run on it.
 *
 * @example
 * const consent = fakeConsent((fake) => fake.set(ConsentCategory.Analytics, true));
 * renderRoute(Routes.settings, { locale: "en", consent });
 * expect(consent.isGranted(ConsentCategory.CrashReplay)).toBe(false);
 */
export function fakeConsent(configure?: (fake: ConsentLedger) => unknown): ConsentLedger {
  const fake = new ConsentLedger(buildConfig(ConsentConfig), new MemoryConsentStoreDriver());
  configure?.(fake);
  return fake;
}
