/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryFirebaseDriver`: Firebase turns on per project; apps are found and created per
 *          project, platform and identifier; the stand-in config file names the app and project in each platform's
 *          format; Analytics links unless `mayLink` is false, which records nothing.
 * Boundary: test only; in memory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0482 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { MemoryFirebaseDriver } from "#node/drivers/memory-firebase.driver";

describe("MemoryFirebaseDriver", () => {
  it("turns Firebase on and registers apps per platform", async () => {
    const firebase = new MemoryFirebaseDriver();

    expect(await firebase.hasFirebase("acme")).toBe(false);
    await firebase.addFirebase("acme");
    expect(await firebase.hasFirebase("acme")).toBe(true);
    expect(await firebase.findApp("acme", "ios", "com.acme.staff")).toBeNull();
    const ios = await firebase.createApp("acme", "ios", "com.acme.staff", "Staff");
    const android = await firebase.createApp("acme", "android", "com.acme.staff", "Staff");

    expect(ios).toBe("1:000000000000:ios:1");
    expect(android).toBe("1:000000000000:android:2");
    expect(await firebase.findApp("acme", "ios", "com.acme.staff")).toBe(ios);
    expect(firebase.calls).toEqual([
      "addFirebase acme",
      "createApp acme ios com.acme.staff Staff",
      "createApp acme android com.acme.staff Staff",
    ]);
  });

  it("writes a config file naming the app and project", async () => {
    const firebase = new MemoryFirebaseDriver();

    const plist = await firebase.configFile("acme", "ios", "1:0:ios:1");
    const json = await firebase.configFile("acme", "android", "1:0:android:2");

    expect(plist).toContain("<key>GOOGLE_APP_ID</key><string>1:0:ios:1</string>");
    expect(plist).toContain("<key>PROJECT_ID</key><string>acme</string>");
    expect(JSON.parse(json)).toEqual({
      project_info: { project_id: "acme" },
      client: [{ client_info: { mobilesdk_app_id: "1:0:android:2" } }],
    });
  });

  it("links Analytics unless the grant is missing", async () => {
    const firebase = new MemoryFirebaseDriver();

    expect(await firebase.linkAnalytics("acme", "accounts/1")).toBe(true);
    expect(await firebase.analyticsLinked("acme")).toBe(true);
    firebase.mayLink = false;
    expect(await firebase.linkAnalytics("other", "accounts/1")).toBe(false);
    expect(await firebase.analyticsLinked("other")).toBe(false);
    expect(firebase.calls).toEqual(["linkAnalytics acme accounts/1"]);
  });
});
