/**
 * Stackra file contract:
 * Purpose: unit tests of `ConsentLedger`, the rules of ADR 0298: decline by default, a required category is granted
 *          and cannot be refused, Global Privacy Control refuses, a decision for another policy version or past its
 *          expiry reads as undecided, a region's opt-out regime grants a `defaultGranted` category, and every change
 *          is written to the store and announced.
 * Boundary: test only; the store is the memory driver, time is frozen and the navigator stubbed per test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0298 (decisions 1 to 4).
 */
import { buildConfig } from "@stackra/config";
import type { ConfigValues } from "@stackra/config";
import { afterEach, describe, expect, freezeClock, it } from "@stackra/testing";
import { vi } from "vitest";

import { ConsentConfig } from "#config/consent.config";
import type { ConsentRecord } from "#contracts/types/consent-record.type";
import { MemoryConsentStoreDriver } from "#core/drivers/memory-consent-store.driver";
import { ConsentCategory } from "#core/enums/consent-category.enum";
import { ConsentRegime } from "#core/enums/consent-regime.enum";
import { ConsentStatus } from "#core/enums/consent-status.enum";
import { ConsentLedger } from "#core/services/consent-ledger.service";
import type { ConsentCategoryEntry } from "#core/types/consent-category-entry.type";

/** The template's mobile categories: necessary required, analytics and crash replay optional. */
const CATEGORIES: ConsentCategoryEntry[] = [
  {
    category: ConsentCategory.Necessary,
    required: true,
    defaultGranted: true,
    descriptionKey: null,
  },
  {
    category: ConsentCategory.Analytics,
    required: false,
    defaultGranted: true,
    descriptionKey: null,
  },
  {
    category: ConsentCategory.CrashReplay,
    required: false,
    defaultGranted: false,
    descriptionKey: null,
  },
];

/** A ledger over a fresh memory store, with `values` layered on the defaults. */
function ledgerWith(values: Partial<ConfigValues<ConsentConfig>> = {}) {
  const store = new MemoryConsentStoreDriver();
  const config = buildConfig(ConsentConfig, {
    values: { categories: CATEGORIES, policyVersion: "2026-10", expiryDays: 30, ...values },
  });
  return { ledger: new ConsentLedger(config, store), store };
}

/** A record answering the current policy version, decided now. */
const recordOf = (categories: Record<string, boolean>): ConsentRecord => ({
  policyVersion: "2026-10",
  decidedAt: new Date().toISOString(),
  categories,
});

describe("ConsentLedger", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("before a decision", () => {
    it("grants only the required category and leaves the rest undecided", () => {
      const { ledger } = ledgerWith();
      expect(ledger.status(ConsentCategory.Necessary)).toBe(ConsentStatus.Granted);
      expect(ledger.status(ConsentCategory.Analytics)).toBe(ConsentStatus.Undecided);
      expect(ledger.isGranted(ConsentCategory.Analytics)).toBe(false);
      expect(ledger.isGranted(ConsentCategory.CrashReplay)).toBe(false);
    });

    it("treats an unlisted category as optional and undecided", () => {
      const { ledger } = ledgerWith({ categories: CATEGORIES.slice(0, 1) });
      expect(ledger.status(ConsentCategory.CrashReplay)).toBe(ConsentStatus.Undecided);
      expect(ledger.isRequired(ConsentCategory.CrashReplay)).toBe(false);
    });

    it("declines under the gdpr default even for a defaultGranted category", () => {
      const { ledger } = ledgerWith({ regionDefaults: { default: ConsentRegime.Gdpr } });
      expect(ledger.status(ConsentCategory.Analytics)).toBe(ConsentStatus.Undecided);
    });

    it("grants a defaultGranted category under an opt-out default, and nothing else", () => {
      const { ledger } = ledgerWith({ regionDefaults: { default: ConsentRegime.Ccpa } });
      expect(ledger.status(ConsentCategory.Analytics)).toBe(ConsentStatus.Granted);
      expect(ledger.status(ConsentCategory.CrashReplay)).toBe(ConsentStatus.Undecided);
    });

    it("applies the visitor's region, then the default entry, then decline", () => {
      const { ledger } = ledgerWith({ regionDefaults: { US: ConsentRegime.Ccpa } });
      expect(ledger.isGranted(ConsentCategory.Analytics)).toBe(false);
      ledger.setRegion("US");
      expect(ledger.isGranted(ConsentCategory.Analytics)).toBe(true);
      ledger.setRegion("DE");
      expect(ledger.isGranted(ConsentCategory.Analytics)).toBe(false);
      ledger.setRegion(null);
      expect(ledger.isGranted(ConsentCategory.Analytics)).toBe(false);
    });
  });

  describe("decisions", () => {
    it("records a choice under the current policy version, keeping the others", () => {
      freezeClock("2026-10-24T09:00:00Z");
      const { ledger, store } = ledgerWith();
      ledger.set(ConsentCategory.Analytics, true);
      ledger.set(ConsentCategory.CrashReplay, false);
      expect(store.read()).toEqual({
        policyVersion: "2026-10",
        decidedAt: "2026-10-24T09:00:00.000Z",
        categories: { analytics: true, crash_replay: false },
      });
      expect(ledger.status(ConsentCategory.Analytics)).toBe(ConsentStatus.Granted);
      expect(ledger.status(ConsentCategory.CrashReplay)).toBe(ConsentStatus.Denied);
    });

    it("lets a refusal win over an opt-out default", () => {
      const { ledger } = ledgerWith({ regionDefaults: { default: ConsentRegime.Ccpa } });
      ledger.set(ConsentCategory.Analytics, false);
      expect(ledger.status(ConsentCategory.Analytics)).toBe(ConsentStatus.Denied);
    });

    it("never refuses or stores a required category", () => {
      const { ledger, store } = ledgerWith();
      const listener = vi.fn();
      ledger.subscribe(listener);
      ledger.set(ConsentCategory.Necessary, false);
      expect(ledger.status(ConsentCategory.Necessary)).toBe(ConsentStatus.Granted);
      expect(store.read()).toBeNull();
      expect(listener).not.toHaveBeenCalled();
    });

    it("reads a decision for another policy version as undecided and drops it on the next write", () => {
      const { ledger, store } = ledgerWith();
      store.write({
        ...recordOf({ analytics: true, crash_replay: true }),
        policyVersion: "2026-01",
      });
      expect(ledger.status(ConsentCategory.Analytics)).toBe(ConsentStatus.Undecided);
      ledger.set(ConsentCategory.Analytics, true);
      expect(store.read()?.categories).toEqual({ analytics: true });
    });

    it("reads a decision past its expiry as undecided", () => {
      freezeClock("2026-10-01T00:00:00Z");
      const { ledger } = ledgerWith();
      ledger.set(ConsentCategory.Analytics, true);
      freezeClock("2026-10-30T23:59:59Z");
      expect(ledger.isGranted(ConsentCategory.Analytics)).toBe(true);
      freezeClock("2026-10-31T00:00:00Z");
      expect(ledger.status(ConsentCategory.Analytics)).toBe(ConsentStatus.Undecided);
    });

    it("forgets one category, or every decision", () => {
      const { ledger, store } = ledgerWith();
      ledger.set(ConsentCategory.Analytics, true);
      ledger.set(ConsentCategory.CrashReplay, true);
      ledger.reset(ConsentCategory.Analytics);
      expect(ledger.status(ConsentCategory.Analytics)).toBe(ConsentStatus.Undecided);
      expect(ledger.status(ConsentCategory.CrashReplay)).toBe(ConsentStatus.Granted);
      ledger.reset(ConsentCategory.CrashReplay);
      expect(store.read()).toBeNull();
      ledger.set(ConsentCategory.Analytics, false);
      ledger.reset();
      expect(store.read()).toBeNull();
      expect(ledger.status(ConsentCategory.Analytics)).toBe(ConsentStatus.Undecided);
    });

    it("clears the store when there is nothing current to forget a category from", () => {
      const { ledger, store } = ledgerWith();
      store.write({ ...recordOf({ analytics: true }), policyVersion: "old" });
      ledger.reset(ConsentCategory.Analytics);
      expect(store.read()).toBeNull();
    });
  });

  describe("Global Privacy Control", () => {
    it("refuses every optional category, whatever is stored or defaulted", () => {
      vi.stubGlobal("navigator", { globalPrivacyControl: true });
      const { ledger } = ledgerWith({ regionDefaults: { default: ConsentRegime.Ccpa } });
      expect(ledger.status(ConsentCategory.Analytics)).toBe(ConsentStatus.Denied);
      ledger.set(ConsentCategory.Analytics, true);
      expect(ledger.isGranted(ConsentCategory.Analytics)).toBe(false);
      expect(ledger.status(ConsentCategory.Necessary)).toBe(ConsentStatus.Granted);
    });
  });

  describe("subscriptions", () => {
    it("announces each change and counts it, until unsubscribed", () => {
      const { ledger } = ledgerWith();
      const listener = vi.fn();
      const stop = ledger.subscribe(listener);
      expect(ledger.revision).toBe(0);
      ledger.set(ConsentCategory.Analytics, true);
      ledger.reset();
      ledger.setRegion("US");
      ledger.setRegion("US");
      expect(listener).toHaveBeenCalledTimes(3);
      expect(ledger.revision).toBe(3);
      stop();
      ledger.set(ConsentCategory.Analytics, false);
      expect(listener).toHaveBeenCalledTimes(3);
    });
  });
});
