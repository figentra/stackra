/**
 * Stackra file contract:
 * Purpose: unit tests of `testbedPlan`: two disks with the 200 GB XFS volume at `/data`, both deleted with the
 *          instance; `heavy` on-demand and spot only on `light`; one region; the owner's counts and instance types;
 *          the guard, idle and image numbers; grants only when a project id is given and no secret value anywhere;
 *          bad input refused; the toolchain pins equal `mise.toml` and the catalogue.
 * Boundary: test only; reads `mise.toml` and `pnpm-workspace.yaml` at the repository root, calls no cloud.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0484 (Enforcement); ADR 0173.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "@stackra/testing";

import { TOOLCHAIN_PINS } from "#core/constants/toolchain-pins.constant";
import { testbedPlan } from "#core/functions/testbed-plan.function";

const ROOT = new URL("../../../../../../../", import.meta.url);

function repoFile(name: string): string {
  return readFileSync(fileURLToPath(new URL(name, ROOT)), "utf8");
}

describe("testbedPlan", () => {
  const plan = testbedPlan({ identityId: "id-1", ciGateProjectId: "proj-1" });

  it("has two disks, the data volume XFS at /data, both deleted with the instance", () => {
    expect(plan.disks.root).toMatchObject({ sizeGb: 40, type: "gp3" });
    expect(plan.disks.data).toMatchObject({
      sizeGb: 200,
      type: "gp3",
      mount: "/data",
      filesystem: "xfs",
    });
    expect(plan.disks.deleteOnTermination).toBe(true);
  });

  it("keeps heavy on-demand and puts spot only on light", () => {
    expect(plan.groups.heavy).toMatchObject({
      purchase: "on-demand",
      instanceTypes: ["c7i.2xlarge"],
      min: 2,
      max: 6,
    });
    expect(plan.groups.light).toMatchObject({
      purchase: "spot",
      instanceTypes: ["c7i.2xlarge", "c6i.2xlarge", "m7i.2xlarge"],
      min: 1,
      max: 4,
    });
    expect(plan.groups.heavy.name).toBe("stackra-testbed-heavy");
    expect(plan.groups.light.name).toBe("stackra-testbed-light");
  });

  it("plans one region, eu-west-1 by default", () => {
    expect(plan.region).toBe("eu-west-1");
    expect(testbedPlan({ region: "eu-central-1" }).region).toBe("eu-central-1");
  });

  it("carries the guard, idle and image numbers", () => {
    expect(plan.guard).toMatchObject({
      cleanupPercent: 70,
      drainPercent: 85,
      rootMinFreeGb: 10,
      turboCacheGb: 20,
      seedMaxAgeDays: 7,
    });
    expect(plan.idleMinutes).toBe(60);
    expect(plan.image.schedule).toBe("cron(0 3 ? * SUN *)");
    expect(plan.image.amiParameter).toBe("/stackra/testbed/ami");
  });

  it("grants figentra-ci-gate paths to the core project, ids only", () => {
    expect(plan.secretGrants.projects.core).toEqual([
      { projectId: "proj-1", environment: "prod", path: "/ci" },
      { projectId: "proj-1", environment: "prod", path: "/ci/turbo" },
    ]);
    expect(
      testbedPlan({ identityId: "id-1", ciGateProjectId: "proj-1", turboProjectId: "proj-2" })
        .secretGrants.projects.core?.[1],
    ).toEqual({ projectId: "proj-2", environment: "prod", path: "/ci/turbo" });
    expect(plan.secretGrants.identityName).toBe("gate");
    expect(testbedPlan().secretGrants.projects).toEqual({});
  });

  it("refuses spot for heavy, a minimum above the maximum and a bad region", () => {
    expect(() => testbedPlan({ heavy: { min: 5, max: 2 } })).toThrow();
    expect(() => testbedPlan({ region: "mars" })).toThrow();
    expect(() => testbedPlan({ spot: true } as never)).toThrow();
  });

  it("pins the toolchain to mise.toml and the catalogue", () => {
    const mise = repoFile("mise.toml");
    expect(mise).toContain(`node = "${TOOLCHAIN_PINS.node}"`);
    expect(mise).toContain(`pnpm = "${TOOLCHAIN_PINS.pnpm}"`);
    expect(mise).toContain(`"github:Infisical/cli" = "${TOOLCHAIN_PINS.infisical}"`);
    expect(repoFile("pnpm-workspace.yaml")).toContain(
      `"@playwright/test": ${TOOLCHAIN_PINS.playwright}`,
    );
    expect(plan.toolchain.node).toBe(TOOLCHAIN_PINS.node);
  });
});
