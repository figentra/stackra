/**
 * Stackra file contract:
 * Purpose: unit tests of `mobileStack` under Pulumi mocks: every `ref:` fact resolves from the stack config, an
 *          inlined id passes through, an unset key fails naming it, a value of the wrong shape fails naming its key,
 *          and the slice registers no resource.
 * Boundary: test only; `runtime.setMocks` and `runtime.setAllConfig` stand in for the engine and the stack config,
 *           so nothing reaches a cloud.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0171 (decisions 2 to 4); ADR 0325 (rule 1).
 */
import { runtime } from "@pulumi/pulumi";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import type { MobileInfraPlan } from "#core/types/mobile-infra-plan.type";
import { MobileInfraInvalidError } from "#core/errors/mobile-infra-invalid.error";
import { mobileStack } from "#node/functions/mobile-stack.function";

const BUNDLE_ID = "example.acme.mobile";
const PROJECT_ID = "0f5c7f2e-8a9b-4c1d-9e2f-3a4b5c6d7e8f";
const FINGERPRINT = Array.from({ length: 32 }, () => "AB").join(":");

/** A plan as `mobileInfraPlan` builds it from the template's runways. */
const PLAN: MobileInfraPlan = {
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
    { environment: "staging", profile: "staging", channel: "staging", easEnvironment: "staging" },
  ],
  ownerTasks: [{ step: "eas_project", configKey: "expo:projectId" }],
};

/** The stack config the stacks repository holds for the plan's refs. */
const CONFIG = {
  "expo:projectId": PROJECT_ID,
  "apple:teamId": "AB12CD34EF",
  "apple:ascAppId": "6450000001",
  "google:playDeveloperId": "8123456789012345678",
  "google:appSigningSha256": FINGERPRINT,
};

const registered: string[] = [];

beforeEach(async () => {
  registered.length = 0;
  await runtime.setMocks(
    {
      newResource: (args) => {
        registered.push(args.type);
        return { id: `${args.name}-id`, state: {} };
      },
      call: () => ({}),
    },
    "infra",
    "staging",
    true,
  );
  runtime.setAllConfig(CONFIG);
});

describe("mobileStack", () => {
  it("resolves every ref from the stack config", () => {
    expect(mobileStack(PLAN)).toEqual({
      ...PLAN,
      expo: { account: "acme", projectId: PROJECT_ID },
      ios: { ...PLAN.ios, teamId: "AB12CD34EF", ascAppId: "6450000001" },
      android: {
        package: BUNDLE_ID,
        playDeveloperId: "8123456789012345678",
        appSigningSha256: FINGERPRINT,
      },
    });
  });

  it("passes an inlined id through", () => {
    const plan: MobileInfraPlan = {
      expo: { account: "acme", projectId: PROJECT_ID },
      android: { package: BUNDLE_ID },
      environments: [],
      ownerTasks: [],
    };
    runtime.setAllConfig({});

    expect(mobileStack(plan)).toEqual(plan);
  });

  it("fails on an unset stack config key, naming it", () => {
    runtime.setAllConfig(
      Object.fromEntries(Object.entries(CONFIG).filter(([key]) => key !== "apple:teamId")),
    );

    expect(() => mobileStack(PLAN)).toThrow("apple:teamId");
  });

  it("fails on a fact of the wrong shape, naming its key", () => {
    runtime.setAllConfig({ ...CONFIG, "apple:teamId": "ab12", "google:appSigningSha256": "AB" });

    let paths: string[] = [];
    try {
      mobileStack(PLAN);
    } catch (error) {
      if (error instanceof MobileInfraInvalidError) paths = error.issues.map((issue) => issue.path);
    }
    expect(paths).toEqual(["apple:teamId", "google:appSigningSha256"]);
  });

  it("checks an inlined fact under its runway path", () => {
    expect(() =>
      mobileStack({ ...PLAN, expo: { account: "acme", projectId: "not-a-uuid" } }),
    ).toThrow("root.providers.expo.projectId");
  });

  it("registers no resource", async () => {
    mobileStack(PLAN);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(registered).toEqual([]);
  });
});
