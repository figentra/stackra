/**
 * Stackra file contract:
 * Purpose: unit tests of `fakeConsent`, in the template settings test's shape: a real `ConsentLedger` with nothing
 *          decided (only `necessary` granted), one grant changes exactly its category, `configure` runs first, and two
 *          fakes never share a decision.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0298 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { ConsentCategory, ConsentLedger } from "#core/index";
import { fakeConsent } from "#testing/functions/fake-consent.function";

describe("fakeConsent", () => {
  it("is a real ledger with nothing optional granted", () => {
    const consent = fakeConsent();
    expect(consent).toBeInstanceOf(ConsentLedger);
    expect(consent.isGranted(ConsentCategory.Necessary)).toBe(true);
    expect(consent.isGranted(ConsentCategory.Analytics)).toBe(false);
    expect(consent.isGranted(ConsentCategory.CrashReplay)).toBe(false);
  });

  it("grants exactly the category it is told to", () => {
    const consent = fakeConsent();
    consent.set(ConsentCategory.Analytics, true);
    expect(consent.isGranted(ConsentCategory.Analytics)).toBe(true);
    expect(consent.isGranted(ConsentCategory.CrashReplay)).toBe(false);
  });

  it("runs configure on the ledger it returns", () => {
    const configure = vi.fn((fake: ConsentLedger) => fake.set(ConsentCategory.CrashReplay, true));
    const consent = fakeConsent(configure);
    expect(configure).toHaveBeenCalledWith(consent);
    expect(consent.isGranted(ConsentCategory.CrashReplay)).toBe(true);
  });

  it("never shares a decision between fakes", () => {
    fakeConsent((fake) => fake.set(ConsentCategory.Analytics, true));
    expect(fakeConsent().isGranted(ConsentCategory.Analytics)).toBe(false);
  });
});
