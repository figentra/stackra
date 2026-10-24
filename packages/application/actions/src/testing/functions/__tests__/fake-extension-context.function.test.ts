/**
 * Stackra file contract:
 * Purpose: unit tests of `fakeExtensionContext`: the system caller and default request facts, a clock frozen at
 *          creation (pinned by `freezeClock`), and overrides.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (testing helpers).
 */
import { ActorKind } from "@stackra/contracts";
import { describe, expect, freezeClock, it } from "@stackra/testing";

import { fakeExtensionContext } from "#testing/functions/fake-extension-context.function";

describe(fakeExtensionContext, () => {
  it("defaults to a system caller and the default request facts", () => {
    const ctx = fakeExtensionContext();
    expect(ctx.actor).toEqual({ kind: ActorKind.System, id: "sys_test" });
    expect(ctx).toMatchObject({
      locale: "en",
      timeZone: "UTC",
      currency: "USD",
      market: "default",
    });
    expect(ctx.abortSignal.aborted).toBe(false);
  });

  it("freezes its clock at creation", () => {
    freezeClock("2026-10-24T10:00:00.000Z");
    const ctx = fakeExtensionContext();
    expect(ctx.now().toISOString()).toBe("2026-10-24T10:00:00.000Z");
    expect(ctx.now()).not.toBe(ctx.now());
  });

  it("takes overrides", () => {
    const ctx = fakeExtensionContext({ locale: "ar-SA", tenantId: "ten_1" });
    expect(ctx.locale).toBe("ar-SA");
    expect(ctx.tenantId).toBe("ten_1");
  });
});
