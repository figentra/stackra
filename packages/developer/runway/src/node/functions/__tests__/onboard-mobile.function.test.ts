/**
 * Stackra file contract:
 * Purpose: unit tests of `onboardMobile`: a dry run of a new app plans every step and writes nothing; a live run
 *          derives and writes the ids (comments kept), creates the EAS, Google, Firebase and Sentry projects, registers
 *          the bundle id with its capabilities, creates the FCM key and writes it blind; a second run is all done and
 *          calls nothing; set ids are kept; the missing App Store Connect record, a taken Google id, the missing
 *          Analytics grant, missing store keys and a Play app without a release are manual with the owner's steps; no
 *          key ever reaches a step.
 * Boundary: test only; a temporary product repository and the memory drivers, so nothing leaves the process.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0482; spec sta-1623.
 */
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { parse } from "yaml";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { MemoryAppleDeveloperDriver } from "#node/drivers/memory-apple-developer.driver";
import { MemoryExpoProjectsDriver } from "#node/drivers/memory-expo-projects.driver";
import { MemoryFirebaseDriver } from "#node/drivers/memory-firebase.driver";
import { MemoryGoogleCloudDriver } from "#node/drivers/memory-google-cloud.driver";
import { MemoryPlayConsoleDriver } from "#node/drivers/memory-play-console.driver";
import { MemorySentryProjectsDriver } from "#node/drivers/memory-sentry-projects.driver";
import { MemoryVaultWriterDriver } from "#node/drivers/memory-vault-writer.driver";
import { onboardMobile } from "#node/functions/onboard-mobile.function";
import type { MobileOnboard } from "#node/types/mobile-onboard.type";
import type { MobileOnboardRequest } from "#node/types/mobile-onboard-request.type";

/** A new product with one app and no ids. */
const RUNWAY = `# Commerce root runway
version: 3
project: commerce
product:
  key: commerce
environments: {}
mobile:
  # the staff app
  staff:
    template: os/mobile@3
    identity:
      name: { en: Commerce Staff }
      links: [staff.commerce.example]
    capabilities: [push]
    signIn:
      social: [apple, google]
    google:
      analyticsAccount: "123456"
    eas:
      channel: production
`;

/** Every root-kit name, set (to stand-ins: the test never prints them). */
const KEYS = {
  EXPO_TOKEN: "x",
  ASC_API_KEY_ID: "x",
  ASC_API_ISSUER_ID: "x",
  ASC_API_PRIVATE_KEY: "x",
  GOOGLE_PLAY_SERVICE_ACCOUNT_JSON: "x",
};

let repository: string;
let ports: {
  apple: MemoryAppleDeveloperDriver;
  play: MemoryPlayConsoleDriver;
  expo: MemoryExpoProjectsDriver;
  google: MemoryGoogleCloudDriver;
  firebase: MemoryFirebaseDriver;
  sentry: MemorySentryProjectsDriver;
  vault: MemoryVaultWriterDriver;
};

/** A request for `staff` with `overrides`. */
function request(overrides: Partial<MobileOnboardRequest> = {}): MobileOnboardRequest {
  return { repository, app: "staff", env: KEYS, ...ports, ...overrides };
}

/** The state of each step, by key. */
function states(result: MobileOnboard): Record<string, string> {
  return Object.fromEntries(result.steps.map((step) => [step.key, step.state]));
}

/** Every change any driver recorded. */
function changes(): string[] {
  return [
    ...ports.apple.calls,
    ...ports.expo.calls,
    ...ports.google.calls,
    ...ports.firebase.calls,
    ...ports.sentry.calls,
    ...ports.vault.names,
  ];
}

/** Stands for the owner's portal steps being done. */
function ownerStepsDone(): void {
  ports.apple.apps.set("com.figentra.commerce.staff", "6400000001");
  ports.play.apps.set("com.figentra.commerce.staff", { hasRelease: true });
}

beforeEach(() => {
  repository = mkdtempSync(join(tmpdir(), "onboard-mobile-"));
  writeFileSync(join(repository, "runway.yaml"), RUNWAY);
  writeFileSync(join(repository, "mise.toml"), '[tools]\nnode = "24.22.0"\npnpm = "12.6.0"\n');
  ports = {
    apple: new MemoryAppleDeveloperDriver(),
    play: new MemoryPlayConsoleDriver(),
    expo: new MemoryExpoProjectsDriver(),
    google: new MemoryGoogleCloudDriver(),
    firebase: new MemoryFirebaseDriver(),
    sentry: new MemorySentryProjectsDriver(),
    vault: new MemoryVaultWriterDriver(),
  };
});

afterEach(() => {
  rmSync(repository, { recursive: true, force: true });
});

describe("onboardMobile", () => {
  // @covers sta-1623:FR-001
  // @covers sta-1623:FR-004
  it("plans every step of a new app on a dry run and writes or creates nothing", async () => {
    const result = await onboardMobile(request({ dryRun: true }));

    expect(result.steps.map((step) => step.key)).toEqual([
      "identity",
      "eas-project",
      "eas-profiles",
      "apple-bundle",
      "apple-app-record",
      "google-project",
      "firebase",
      "analytics-link",
      "sentry",
      "signing",
      "push",
      "store-keys",
      "play-app",
    ]);
    expect(states(result)).toMatchObject({
      identity: "planned",
      "eas-project": "planned",
      "apple-bundle": "planned",
      "apple-app-record": "manual",
      "google-project": "planned",
      firebase: "planned",
      "analytics-link": "planned",
      sentry: "planned",
      signing: "blocked",
      "store-keys": "planned",
      "play-app": "manual",
    });
    expect(result.written).toEqual([]);
    expect(changes()).toEqual([]);
    expect(readFileSync(join(repository, "runway.yaml"), "utf8")).toBe(RUNWAY);
  });

  // @covers sta-1623:FR-002
  // @covers sta-1623:FR-003
  // @covers sta-1623:FR-006
  it("onboards a new app live and writes the ids, project ids and DSN into runway.yaml with its comments", async () => {
    const result = await onboardMobile(request());

    expect(result.ids).toEqual({
      bundleId: "com.figentra.commerce.staff",
      packageName: "com.figentra.commerce.staff",
    });
    expect(ports.apple.calls).toEqual([
      "registerBundle com.figentra.commerce.staff Commerce Staff",
      "enableCapability bundle-1 PUSH_NOTIFICATIONS",
      "enableCapability bundle-1 APPLE_ID_AUTH",
      "enableCapability bundle-1 ASSOCIATED_DOMAINS",
    ]);
    expect(ports.expo.calls).toEqual([
      "createProject figentra commerce-staff",
      "uploadFcmKey project-1 com.figentra.commerce.staff",
    ]);
    expect(ports.google.calls).toEqual([
      "createProject commerce Commerce Staff",
      "ensureServiceAccount commerce eas-fcm roles/firebasecloudmessaging.admin",
      "createKey commerce eas-fcm@commerce.iam.gserviceaccount.com",
    ]);
    expect(ports.vault.names).toEqual(["prod:/ci/store/commerce/FCM_SERVICE_ACCOUNT_JSON"]);
    expect(ports.firebase.calls).toEqual([
      "addFirebase commerce",
      "createApp commerce ios com.figentra.commerce.staff Commerce Staff",
      "createApp commerce android com.figentra.commerce.staff Commerce Staff",
      "linkAnalytics commerce 123456",
    ]);
    expect(ports.sentry.calls).toEqual(["createProject figentra mobile commerce-staff"]);

    const written = readFileSync(join(repository, "runway.yaml"), "utf8");
    expect(written).toContain("# the staff app");
    expect(written).toContain("bundleId: com.figentra.commerce.staff");
    expect(written).toContain("package: com.figentra.commerce.staff");
    expect(written).toContain("project: project-1");
    expect(written).toContain("project: commerce");
    expect(written).toContain("dsn: https://public@o0.ingest.sentry.io/1");
    expect(result.written).toEqual([
      "runway.yaml",
      "assets/mobile/staff/GoogleService-Info.plist",
      "assets/mobile/staff/google-services.json",
    ]);
    expect(existsSync(join(repository, "assets/mobile/staff/google-services.json"))).toBe(true);
    expect(JSON.stringify(result)).not.toContain(ports.google.key);
    expect(JSON.stringify(result)).not.toContain("memory-canary");
  });

  // @covers sta-1623:FR-001
  it("reports every step done and calls nothing on a second run once the owner steps are done", async () => {
    ownerStepsDone();
    await onboardMobile(request());
    const project = ports.expo.projects.get("figentra/commerce-staff") as string;
    ports.expo.held.set(project, {
      ios: { signing: true, push: true },
      android: { signing: true, push: true },
    });
    const before = changes().length;

    const again = await onboardMobile(request());

    expect(new Set(Object.values(states(again)))).toEqual(new Set(["done"]));
    expect(again.written).toEqual([]);
    expect(changes()).toHaveLength(before);
  });

  // @covers sta-1623:FR-002
  it("keeps ids the runway sets", async () => {
    writeFileSync(
      join(repository, "runway.yaml"),
      RUNWAY.replace(
        "    identity:\n",
        "    identity:\n      ios: { bundleId: app.commerce.staff }\n      android: { package: app.commerce.staff }\n",
      ),
    );

    const result = await onboardMobile(request({ dryRun: true }));

    expect(result.ids).toEqual({
      bundleId: "app.commerce.staff",
      packageName: "app.commerce.staff",
    });
    expect(result.steps[0]).toMatchObject({ key: "identity", state: "done" });
  });

  it("drops the app segment when it repeats the product and turns - into _ on Android", async () => {
    writeFileSync(
      join(repository, "runway.yaml"),
      RUNWAY.replace("key: commerce", "key: my-shop").replace("  staff:", "  my-shop:"),
    );

    const result = await onboardMobile(request({ app: "my-shop", dryRun: true }));

    expect(result.ids).toEqual({
      bundleId: "com.figentra.my-shop",
      packageName: "com.figentra.my_shop",
    });
  });

  // @covers sta-1623:FR-009
  it("gives the owner's steps for the App Store Connect record and the first Play upload", async () => {
    const result = await onboardMobile(request());
    const record = result.steps.find((step) => step.key === "apple-app-record");
    const play = result.steps.find((step) => step.key === "play-app");

    expect(record?.manual?.join("\n")).toContain(
      "Bundle ID com.figentra.commerce.staff; SKU commerce-staff",
    );
    expect(play?.manual?.[0]).toContain("Play Console › Create app");
    expect(play?.manual?.join("\n")).toContain("Internal testing");

    ports.play.apps.set("com.figentra.commerce.staff", { hasRelease: false });
    const uploaded = await onboardMobile(request());
    const pending = uploaded.steps.find((step) => step.key === "play-app");
    expect(pending?.state).toBe("manual");
    expect(pending?.manual?.[0]).not.toContain("Create app");
  });

  it("makes a taken Google project id, a missing Analytics grant and missing store keys manual", async () => {
    ports.google.taken.add("commerce");
    ports.firebase.mayLink = false;

    const taken = await onboardMobile(request({ env: { EXPO_TOKEN: "x" } }));

    expect(states(taken)).toMatchObject({
      "google-project": "manual",
      firebase: "blocked",
      "store-keys": "manual",
    });
    expect(taken.steps.find((step) => step.key === "store-keys")?.detail).toContain(
      "ASC_API_KEY_ID",
    );
    const runway = parse(readFileSync(join(repository, "runway.yaml"), "utf8")) as {
      mobile: { staff: { google: { project?: string } } };
    };
    expect(runway.mobile.staff.google.project).toBeUndefined();

    ports.google.taken.clear();
    const ungranted = await onboardMobile(request());
    expect(states(ungranted)["analytics-link"]).toBe("manual");
  });

  it("asks for an exact node pin", async () => {
    writeFileSync(join(repository, "mise.toml"), '[tools]\nnode = "24"\n');

    const result = await onboardMobile(request({ dryRun: true }));

    expect(states(result)["eas-profiles"]).toBe("manual");
  });

  it("refuses an app the runway does not have", async () => {
    await expect(onboardMobile(request({ app: "kiosk" }))).rejects.toBeInstanceOf(
      RunwayInvalidError,
    );
  });
});
