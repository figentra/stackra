/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryExpoProjectsDriver`: an unknown project is `null` and a created one gets the next id
 *          under `<owner>/<slug>`; an unseeded project holds no credential; an FCM key upload marks only Android push
 *          held, keeping the rest; the changes are recorded in order.
 * Boundary: test only; in memory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0482 (decisions 4 and 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { MemoryExpoProjectsDriver } from "#node/drivers/memory-expo-projects.driver";

describe("MemoryExpoProjectsDriver", () => {
  it("finds and creates projects by owner and slug", async () => {
    const expo = new MemoryExpoProjectsDriver();

    expect(await expo.findProject("acme", "staff")).toBeNull();
    expect(await expo.createProject("acme", "staff")).toBe("project-1");
    expect(await expo.findProject("acme", "staff")).toBe("project-1");
    expect(await expo.findProject("other", "staff")).toBeNull();
  });

  it("holds nothing for a new project, and marks Android push held on an FCM upload", async () => {
    const expo = new MemoryExpoProjectsDriver();
    expo.held.set("project-9", {
      ios: { signing: true, push: true },
      android: { signing: true, push: false },
    });

    expect(await expo.credentials("project-1")).toEqual({
      ios: { signing: false, push: false },
      android: { signing: false, push: false },
    });
    await expo.uploadFcmKey("project-1", "com.acme.staff");
    await expo.uploadFcmKey("project-9", "com.acme.kiosk");

    expect(await expo.credentials("project-1")).toEqual({
      ios: { signing: false, push: false },
      android: { signing: false, push: true },
    });
    expect(await expo.credentials("project-9")).toEqual({
      ios: { signing: true, push: true },
      android: { signing: true, push: true },
    });
    expect(expo.calls).toEqual([
      "uploadFcmKey project-1 com.acme.staff",
      "uploadFcmKey project-9 com.acme.kiosk",
    ]);
  });
});
