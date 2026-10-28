/**
 * Stackra file contract:
 * Purpose: unit tests of `grantedConsent`: a verified consent that grants `necessary` plus the categories named, once
 *          each, expiring a day after the clock; and that `fakeActionContext` reads as refused (`missing`) without it.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (testing helpers); ADR 0472.
 */
import { describe, expect, freezeClock, it } from "@stackra/testing";

import { ConsentRefusal } from "#contracts/enums/consent-refusal.enum";
import { fakeActionContext } from "#testing/functions/fake-action-context.function";
import { grantedConsent } from "#testing/functions/granted-consent.function";

describe(grantedConsent, () => {
  it("grants necessary and the named categories, once each, for a day", async () => {
    freezeClock("2026-10-28T09:00:00Z");
    const consent = await grantedConsent("analytics", "analytics", "marketing")();
    expect(consent).toEqual({
      verified: true,
      snapshotId: "csn_test",
      subject: "anon_test",
      granted: ["necessary", "analytics", "marketing"],
      expiresAt: new Date("2026-10-29T09:00:00Z"),
    });
  });

  it("is what a fake context reads when passed, and refused (missing) otherwise", async () => {
    expect(await fakeActionContext().consent()).toEqual({
      verified: false,
      refusal: ConsentRefusal.Missing,
      granted: [],
    });
    const ctx = fakeActionContext({ consent: grantedConsent("analytics") });
    expect((await ctx.consent()).granted).toContain("analytics");
  });
});
