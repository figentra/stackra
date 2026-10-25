/**
 * Stackra file contract:
 * Purpose: unit tests of `mobileInfraPlan` over runway documents shaped like the template's root and mobile runways:
 *          the plan and its owner tasks, literal ids, platforms that do not submit or are not targeted, and every
 *          refusal (missing or malformed provider facts, signing outside EAS, an incomplete or shared EAS
 *          environment, a stray surface bundle id, no platform, nothing shipped through EAS).
 * Boundary: test only; the documents go through `parseRunway`, so each fixture is also a valid version 3 runway.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296; ADR 0173; ADR 0344 (decisions 3 and 11).
 */
import { parseRunway } from "@stackra/runway";
import { describe, expect, it } from "@stackra/testing";

import { MobileInfraInvalidError } from "#core/errors/mobile-infra-invalid.error";
import { mobileInfraPlan } from "#core/functions/mobile-infra-plan.function";
import type { MobileIdentity } from "#core/types/mobile-identity.type";

const BUNDLE_ID = "example.acme.mobile";

const IDENTITY = {
  ios: { bundleId: BUNDLE_ID, surfaces: [`${BUNDLE_ID}.widget`] },
  android: { package: BUNDLE_ID },
} satisfies MobileIdentity;

const PROVIDERS = {
  expo: { account: "acme", projectId: "ref:expo.projectId" },
  apple: { teamId: "ref:apple.teamId", ascAppId: "ref:apple.ascAppId" },
  google: {
    playDeveloperId: "ref:google.playDeveloperId",
    appSigningSha256: "ref:google.appSigningSha256",
  },
};

const ROOT_ENVIRONMENTS = {
  dev: { destinations: { mobile: "expo-dev" } },
  preview: { destinations: { mobile: "eas" } },
  staging: { destinations: { mobile: "eas" }, mobile: { channel: "staging" } },
  production: { destinations: { mobile: "eas" }, mobile: { channel: "production" } },
};

const PROFILES = {
  development: { distribution: "internal", developmentClient: true, environment: "development" },
  preview: { distribution: "internal", androidApk: true, environment: "preview" },
  staging: { distribution: "store", autoIncrement: true, environment: "staging" },
  production: { distribution: "store", autoIncrement: true, environment: "production" },
};

const APP_ENVIRONMENTS = {
  dev: { port: 8081, mobile: { devClient: true } },
  preview: { mobile: { channel: "preview", profile: "preview" } },
  staging: { mobile: { profile: "staging" } },
  production: { mobile: { channel: "production", profile: "production" } },
};

/** A root runway like the template's, with parts replaced. */
const root = (parts: Record<string, unknown> = {}) =>
  parseRunway("root", {
    version: 3,
    project: "acme",
    providers: PROVIDERS,
    environments: ROOT_ENVIRONMENTS,
    targets: { eas: { credentials: "eas-managed" } },
    ...parts,
  });

/** A mobile member runway like the template's, with parts replaced. */
const app = (parts: { profiles?: unknown; submit?: unknown; environments?: unknown } = {}) =>
  parseRunway("app", {
    version: 3,
    release: {
      mobile: {
        profiles: parts.profiles ?? PROFILES,
        submit: parts.submit ?? { ios: true, android: true },
      },
    },
    environments: parts.environments ?? APP_ENVIRONMENTS,
  });

/** The paths a refused plan names. */
const pathsOf = (run: () => unknown): string[] => {
  try {
    run();
  } catch (error) {
    if (error instanceof MobileInfraInvalidError) return error.issues.map((issue) => issue.path);
    throw error;
  }
  throw new Error("Expected a MobileInfraInvalidError");
};

describe("mobileInfraPlan", () => {
  it("plans the template's release", () => {
    expect(mobileInfraPlan(root(), app(), IDENTITY)).toEqual({
      expo: { account: "acme", projectId: "ref:expo.projectId" },
      ios: {
        bundleId: BUNDLE_ID,
        teamId: "ref:apple.teamId",
        ascAppId: "ref:apple.ascAppId",
        surfaces: [`${BUNDLE_ID}.widget`],
        appGroup: `group.${BUNDLE_ID}`,
      },
      android: {
        package: BUNDLE_ID,
        playDeveloperId: "ref:google.playDeveloperId",
        appSigningSha256: "ref:google.appSigningSha256",
      },
      environments: [
        {
          environment: "preview",
          profile: "preview",
          channel: "preview",
          easEnvironment: "preview",
        },
        {
          environment: "staging",
          profile: "staging",
          channel: "staging",
          easEnvironment: "staging",
        },
        {
          environment: "production",
          profile: "production",
          channel: "production",
          easEnvironment: "production",
        },
      ],
      ownerTasks: [
        { step: "eas_project", configKey: "expo:projectId" },
        { step: "apple_team", configKey: "apple:teamId" },
        { step: "app_store_record", appId: BUNDLE_ID, configKey: "apple:ascAppId" },
        { step: "ios_signing", appId: BUNDLE_ID },
        { step: "ios_signing", appId: `${BUNDLE_ID}.widget` },
        { step: "apns_key", appId: BUNDLE_ID },
        { step: "play_app", appId: BUNDLE_ID, configKey: "google:playDeveloperId" },
        { step: "play_app_signing", appId: BUNDLE_ID, configKey: "google:appSigningSha256" },
        { step: "android_signing", appId: BUNDLE_ID },
        { step: "fcm_key", appId: BUNDLE_ID },
      ],
    });
  });

  it("keeps an inlined id and names no config key for it", () => {
    const plan = mobileInfraPlan(
      root({
        providers: {
          ...PROVIDERS,
          expo: { account: "acme", projectId: "0f5c7f2e-8a9b-4c1d-9e2f-3a4b5c6d7e8f" },
        },
      }),
      app(),
      IDENTITY,
    );

    expect(plan.expo.projectId).toBe("0f5c7f2e-8a9b-4c1d-9e2f-3a4b5c6d7e8f");
    expect(plan.ownerTasks[0]).toEqual({ step: "eas_project" });
  });

  it("needs no store facts for a platform that does not submit", () => {
    const plan = mobileInfraPlan(
      root({ providers: { expo: PROVIDERS.expo, apple: { teamId: "ref:apple.teamId" } } }),
      app({ submit: { ios: false, android: false } }),
      { ios: { bundleId: BUNDLE_ID }, android: { package: BUNDLE_ID } },
    );

    expect(plan.ios).toEqual({ bundleId: BUNDLE_ID, teamId: "ref:apple.teamId", surfaces: [] });
    expect(plan.android).toEqual({ package: BUNDLE_ID });
    expect(plan.ownerTasks.map((task) => task.step)).toEqual([
      "eas_project",
      "apple_team",
      "ios_signing",
      "apns_key",
      "android_signing",
      "fcm_key",
    ]);
  });

  it("plans only the targeted platform", () => {
    const plan = mobileInfraPlan(
      root({ providers: { expo: PROVIDERS.expo, google: PROVIDERS.google } }),
      app(),
      { android: { package: BUNDLE_ID } },
    );

    expect(plan.ios).toBeUndefined();
    expect(plan.android?.playDeveloperId).toBe("ref:google.playDeveloperId");
    expect(plan.ownerTasks.some((task) => task.step === "apple_team")).toBe(false);
  });

  it("reports every missing or malformed provider fact", () => {
    expect(pathsOf(() => mobileInfraPlan(root({ providers: {} }), app(), IDENTITY))).toEqual([
      "root.providers.expo.account",
      "root.providers.expo.projectId",
      "root.providers.apple.teamId",
      "root.providers.apple.ascAppId",
      "root.providers.google.playDeveloperId",
      "root.providers.google.appSigningSha256",
    ]);

    let message = "";
    try {
      mobileInfraPlan(
        root({ providers: { ...PROVIDERS, expo: { account: "acme", projectId: 42 } } }),
        app(),
        IDENTITY,
      );
    } catch (error) {
      if (error instanceof MobileInfraInvalidError) message = error.message;
    }
    expect(message).toContain("root.providers.expo.projectId: Expected an id or a ref:<path>");
  });

  it("refuses signing credentials outside EAS", () => {
    expect(
      pathsOf(() =>
        mobileInfraPlan(root({ targets: { eas: { credentials: "local" } } }), app(), IDENTITY),
      ),
    ).toEqual(["root.targets.eas.credentials"]);
  });

  it("needs a profile and a channel for each environment that ships through EAS", () => {
    const refused = pathsOf(() =>
      mobileInfraPlan(
        root({
          environments: { ...ROOT_ENVIRONMENTS, production: { destinations: { mobile: "eas" } } },
        }),
        app({
          environments: {
            preview: { mobile: { channel: "preview", profile: "nightly" } },
            staging: {},
            production: { mobile: { profile: "production" } },
          },
        }),
        IDENTITY,
      ),
    );

    expect(refused).toEqual([
      "app.environments.preview.mobile.profile",
      "app.environments.staging.mobile.profile",
      "app.environments.production.mobile.channel",
    ]);
  });

  it("gives each runway environment its own EAS environment", () => {
    const refused = pathsOf(() =>
      mobileInfraPlan(
        root(),
        app({
          profiles: {
            preview: { distribution: "internal" },
            staging: { distribution: "store", environment: "production" },
            production: { distribution: "store", environment: "production" },
          },
        }),
        IDENTITY,
      ),
    );

    expect(refused).toEqual([
      "app.release.mobile.profiles.preview.environment",
      "app.release.mobile.profiles.production.environment",
    ]);
  });

  it("refuses a surface bundle id outside the app's", () => {
    expect(
      pathsOf(() =>
        mobileInfraPlan(root(), app(), {
          ...IDENTITY,
          ios: { bundleId: BUNDLE_ID, surfaces: [`${BUNDLE_ID}.widget`, "example.other.share"] },
        }),
      ),
    ).toEqual(["identity.ios.surfaces.1"]);
  });

  it("needs a targeted platform", () => {
    expect(pathsOf(() => mobileInfraPlan(root(), app(), {}))).toEqual(["identity"]);
  });

  it("needs an environment that ships through EAS", () => {
    expect(
      pathsOf(() =>
        mobileInfraPlan(
          root({ environments: { dev: { destinations: { mobile: "expo-dev" } } } }),
          app(),
          IDENTITY,
        ),
      ),
    ).toEqual(["root.environments"]);
  });
});
