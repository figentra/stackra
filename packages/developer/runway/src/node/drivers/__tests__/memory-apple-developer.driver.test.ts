/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryAppleDeveloperDriver`: an unknown bundle or app is `null`; a registered bundle gets
 *          the next resource id with no capability; a capability lands on the bundle with that resource id only; the
 *          changes are recorded in order and a read is not.
 * Boundary: test only; in memory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0482 (decisions 4 and 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { AppleCapability } from "#core/enums/apple-capability.enum";
import { MemoryAppleDeveloperDriver } from "#node/drivers/memory-apple-developer.driver";

describe("MemoryAppleDeveloperDriver", () => {
  it("registers bundles and enables a capability on the one named", async () => {
    const apple = new MemoryAppleDeveloperDriver();

    expect(await apple.findBundle("com.acme.staff")).toBeNull();
    expect(await apple.registerBundle("com.acme.staff", "Staff")).toBe("bundle-1");
    expect(await apple.registerBundle("com.acme.kiosk", "Kiosk")).toBe("bundle-2");
    await apple.enableCapability("bundle-2", AppleCapability.PushNotifications);

    expect(await apple.findBundle("com.acme.staff")).toEqual({ id: "bundle-1", capabilities: [] });
    expect(await apple.findBundle("com.acme.kiosk")).toEqual({
      id: "bundle-2",
      capabilities: ["PUSH_NOTIFICATIONS"],
    });
    expect(apple.calls).toEqual([
      "registerBundle com.acme.staff Staff",
      "registerBundle com.acme.kiosk Kiosk",
      "enableCapability bundle-2 PUSH_NOTIFICATIONS",
    ]);
  });

  it("answers a seeded app id, and null for another", async () => {
    const apple = new MemoryAppleDeveloperDriver();
    apple.apps.set("com.acme.staff", "6400000000");

    expect(await apple.findApp("com.acme.staff")).toBe("6400000000");
    expect(await apple.findApp("com.acme.kiosk")).toBeNull();
  });
});
