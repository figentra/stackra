/**
 * Stackra file contract:
 * Purpose: unit tests of `CoreRefusals`: frozen, every key equals its class's derived code, the codes the template's
 *          manifests list for core refusals are present, and `CoreRefusals.bridge_rejected.envelope()` gives the
 *          envelope the desktop preload returns.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0140; ADR 0294
 *                     (decision 20).
 */
import { describe, expect, it } from "@stackra/testing";

import { CoreRefusals } from "#core/constants/core-refusals.constant";
import { isRefusal } from "#core/functions/is-refusal.function";

describe("CoreRefusals", () => {
  it("is frozen", () => {
    expect(Object.isFrozen(CoreRefusals)).toBe(true);
  });

  it("keys every class by its derived code", () => {
    for (const [code, type] of Object.entries(CoreRefusals)) {
      const refused = type.create();
      expect(refused.code).toBe(code);
      expect(isRefusal(refused, type)).toBe(true);
    }
  });

  it("has the core codes the committed manifests list", () => {
    expect(Object.keys(CoreRefusals)).toEqual(
      expect.arrayContaining(["forbidden", "not_found", "rate_limited", "workflow_timed_out"]),
    );
  });

  it("builds the envelope the desktop preload returns for an undeclared bridge", () => {
    expect({ ok: false, error: CoreRefusals.bridge_rejected.envelope() }).toEqual({
      ok: false,
      error: { code: "bridge_rejected", category: "forbidden", retryable: false },
    });
  });
});
