/**
 * Stackra file contract:
 * Purpose: unit tests of `PLATFORM_BINDINGS`: each platform service gen binds is keyed `<package>#<Class>` and lists
 *          its constructor tokens in parameter order (`RequestContext`, `IntegrationRuntime`, `Locks`,
 *          `WebhookReceiver`); the map is frozen.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0263; ADR 0136; ADR 0308; ADR 0224.
 */
import { describe, expect, it } from "@stackra/testing";

import { PLATFORM_BINDINGS } from "#core/constants/platform-bindings.constant";

describe("PLATFORM_BINDINGS", () => {
  it("lists each platform service's constructor tokens in order", () => {
    expect(Object.keys(PLATFORM_BINDINGS).sort()).toEqual([
      "@stackra/actions#RequestContext",
      "@stackra/integrations#IntegrationRuntime",
      "@stackra/locking#Locks",
      "@stackra/webhooks#WebhookReceiver",
    ]);
    expect(PLATFORM_BINDINGS["@stackra/locking#Locks"]?.map((token) => token.name)).toEqual([
      "LockDriver",
      "Clock",
    ]);
    expect(
      PLATFORM_BINDINGS["@stackra/webhooks#WebhookReceiver"]?.map((token) => token.name),
    ).toEqual(["ConnectionStore", "SecretStore", "EventOutbox", "Clock"]);
    expect(Object.isFrozen(PLATFORM_BINDINGS)).toBe(true);
  });
});
