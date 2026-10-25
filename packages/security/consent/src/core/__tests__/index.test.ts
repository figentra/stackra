/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: every value the template imports from `@stackra/consent`
 *          (`ConsentCategory`, `ConsentConfig`, `ConsentConfig$`, `ConsentRegime`, `ConsentStatus`, and
 *          `CookieConsentStoreDriver` from the gen wiring) is exported, with the ledger and the other drivers; the port
 *          and the internals are not.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as consent from "#core/index";
import type { ConsentCategoryEntry } from "#core/index";

describe("@stackra/consent", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(consent).sort()).toEqual([
      "ConsentAuthorityMissingError",
      "ConsentCategory",
      "ConsentConfig",
      "ConsentConfig$",
      "ConsentLedger",
      "ConsentOptions",
      "ConsentProofService",
      "ConsentRegime",
      "ConsentStatus",
      "CookieConsentStoreDriver",
      "MemoryConsentProofStoreDriver",
      "MemoryConsentStoreDriver",
      "StorageConsentStoreDriver",
      "needsGuardianConsent",
    ]);
  });

  it("keeps the port and the internals out of the entry", () => {
    for (const name of [
      "ConsentStore",
      "CONSENT_CONFIG_SCHEMA",
      "CONSENT_RECORD_SCHEMA",
      "CONSENT_STORAGE_KEY",
      "parseConsentRecord",
      "hasGlobalPrivacyControl",
    ]) {
      expect(name in consent).toBe(false);
    }
  });

  it("ships a schema a member's generated override extends, as the template's gen sample does", () => {
    const extended = consent.ConsentConfig$.extend({
      policyVersion: consent.ConsentConfig$.shape.policyVersion.unwrap().default("2026-10"),
      askOnFirstLaunch: consent.ConsentConfig$.shape.askOnFirstLaunch.unwrap().default(true),
      categories: consent.ConsentConfig$.shape.categories.unwrap().default(() => [
        {
          category: "necessary" as const,
          required: true,
          defaultGranted: true,
          descriptionKey: "mobile::consent.necessary_hint",
        },
      ]),
    });
    const parsed = extended.parse({});
    expect(parsed.policyVersion).toBe("2026-10");
    expect(parsed.askOnFirstLaunch).toBe(true);
    expect(parsed.categories[0]?.descriptionKey).toBe("mobile::consent.necessary_hint");
  });

  it("types the category entry the template's overrides list", () => {
    expectTypeOf<ConsentCategoryEntry["category"]>().toEqualTypeOf<consent.ConsentCategory>();
    expectTypeOf<ConsentCategoryEntry["descriptionKey"]>().toEqualTypeOf<string | null>();
  });
});
