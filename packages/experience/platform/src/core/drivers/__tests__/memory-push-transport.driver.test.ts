/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryPushTransportDriver`: a prompt is granted on request, a denied permission stays
 *          denied and refuses registration, a granted one registers the `memory` token, and settings opens are counted.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0255 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { PlatformPushTransport } from "#contracts/ports/platform-push-transport.port";
import { MemoryPushTransportDriver } from "#core/drivers/memory-push-transport.driver";

describe("MemoryPushTransportDriver", () => {
  it("grants a prompt and registers the memory token", async () => {
    const push = new MemoryPushTransportDriver();
    expect(push).toBeInstanceOf(PlatformPushTransport);
    expect(await push.permission()).toBe("prompt");
    expect(await push.requestPermission()).toBe("granted");
    expect(await push.register()).toEqual({
      ok: true,
      data: { provider: "memory", token: "memory" },
    });
  });

  it("keeps a denied permission and refuses to register", async () => {
    const push = new MemoryPushTransportDriver();
    push.status = "denied";
    expect(await push.requestPermission()).toBe("denied");
    expect(await push.register()).toEqual({
      ok: false,
      error: { code: "permission_denied", capability: "push" },
    });
  });

  it("counts settings opens", async () => {
    const push = new MemoryPushTransportDriver();
    await push.openSettings();
    expect(push.settingsOpened).toBe(1);
  });
});
