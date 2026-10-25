/**
 * Stackra file contract:
 * Purpose: unit tests of `WEBHOOKS_TESTING_PLUGIN`: named for the package, adds no builder method or app member, and
 *          makes each compiled app the one `deliverWebhook` delivers to.
 * Boundary: test only; the plugin's `app` hook is called with a stand-in app.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3).
 */
import type { TestingApp } from "@stackra/container/testing";
import { describe, expect, it } from "@stackra/testing";

import { CURRENT_APP } from "#testing/constants/current-app.constant";
import { WEBHOOKS_TESTING_PLUGIN } from "#testing/constants/webhooks-testing-plugin.constant";

describe("WEBHOOKS_TESTING_PLUGIN", () => {
  it("is named for the package and adds no builder method", () => {
    expect(WEBHOOKS_TESTING_PLUGIN.name).toBe("@stackra/webhooks");
    expect(WEBHOOKS_TESTING_PLUGIN.builder).toBeUndefined();
  });

  it("makes each compiled app the current one and adds no member", () => {
    const first = {} as TestingApp;
    const second = {} as TestingApp;
    expect(WEBHOOKS_TESTING_PLUGIN.app?.(first)).toEqual({});
    expect(CURRENT_APP.value).toBe(first);
    WEBHOOKS_TESTING_PLUGIN.app?.(second);
    expect(CURRENT_APP.value).toBe(second);
  });
});
