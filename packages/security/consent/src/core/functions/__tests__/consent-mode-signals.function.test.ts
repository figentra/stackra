/**
 * Stackra file contract:
 * Purpose: unit tests of `consentModeSignals`: everything `denied` before a decision, the three `ad_*` signals follow
 *          `marketing` and `analytics_storage` follows `analytics`, and Global Privacy Control denies them all.
 * Boundary: test only; a real ledger over the memory store; stubs the global navigator.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0298 (decisions 1, 2 and 5).
 */
import { buildConfig } from "@stackra/config";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { ConsentConfig } from "#config/consent.config";
import { MemoryConsentStoreDriver } from "#core/drivers/memory-consent-store.driver";
import { ConsentCategory } from "#core/enums/consent-category.enum";
import { consentModeSignals } from "#core/functions/consent-mode-signals.function";
import { ConsentLedger } from "#core/services/consent-ledger.service";

/** A ledger with nothing decided. */
const freshLedger = () =>
  new ConsentLedger(buildConfig(ConsentConfig), new MemoryConsentStoreDriver());

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("consentModeSignals", () => {
  it("denies everything before a decision", () => {
    expect(consentModeSignals(freshLedger())).toEqual({
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    });
  });

  it("grants the ad signals with marketing and analytics storage with analytics", () => {
    const ledger = freshLedger();
    ledger.set(ConsentCategory.Marketing, true);
    expect(consentModeSignals(ledger)).toEqual({
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
      analytics_storage: "denied",
    });
    ledger.set(ConsentCategory.Marketing, false);
    ledger.set(ConsentCategory.Analytics, true);
    expect(consentModeSignals(ledger)).toEqual({
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "granted",
    });
  });

  it("denies everything under Global Privacy Control", () => {
    vi.stubGlobal("navigator", { globalPrivacyControl: true });
    const ledger = freshLedger();
    ledger.set(ConsentCategory.Marketing, true);
    ledger.set(ConsentCategory.Analytics, true);
    expect(Object.values(consentModeSignals(ledger))).toEqual([
      "denied",
      "denied",
      "denied",
      "denied",
    ]);
  });
});
