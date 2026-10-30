/**
 * Stackra file contract:
 * Purpose: `testbedPlan(input?)`, the testbed as plain data: one region, a `heavy` on-demand group (c7i.2xlarge,
 *          2 to 6) and a `light` spot group (c7i, c6i and m7i 2xlarge, 1 to 4), a 40 GB root and a 200 GB XFS `/data`
 *          disk deleted with the instance, the guard thresholds, the 60 minute idle stop, the weekly image schedule,
 *          the toolchain pins and the secret grants. The result is validated by zod.
 * Boundary: pure; no Pulumi, no Node, no cloud. A grant exists only when the caller passes the Infisical project id,
 *           and holds ids and paths, never a value (ADR 0173).
 * Runtime: isomorphic
 * Governing contract: ADR 0484 (decisions 2 to 9); ADR 0173; the owner's answers of 2026-10-30.
 */
import { TESTBED_DEFAULTS as D } from "#core/constants/testbed-defaults.constant";
import { TESTBED_PLAN_INPUT_SCHEMA } from "#core/constants/testbed-plan-input-schema.constant";
import { TESTBED_PLAN_SCHEMA } from "#core/constants/testbed-plan-schema.constant";
import { TOOLCHAIN_PINS } from "#core/constants/toolchain-pins.constant";
import type { TestbedPlan } from "#core/types/testbed-plan.type";
import type { TestbedPlanInput } from "#core/types/testbed-plan-input.type";

/**
 * Plans the testbed.
 *
 * @param input - optional region, group counts and the Infisical ids.
 * @throws ZodError when the input or the resulting plan breaks a rule.
 * @example
 * const plan = testbedPlan({ identityId: config.require("identityId"), ciGateProjectId: config.require("projectId") });
 */
export function testbedPlan(input: TestbedPlanInput = {}): TestbedPlan {
  const given = TESTBED_PLAN_INPUT_SCHEMA.parse(input);
  const environment = given.infisicalEnvironment ?? "prod";
  const grants =
    given.ciGateProjectId === undefined
      ? {}
      : {
          core: ["/", "/ci/turbo"].map((path) => ({
            projectId: given.ciGateProjectId as string,
            environment,
            path,
          })),
        };

  return TESTBED_PLAN_SCHEMA.parse({
    region: given.region ?? D.region,
    groups: {
      heavy: {
        name: `${D.groupPrefix}-heavy`,
        purchase: "on-demand",
        instanceTypes: ["c7i.2xlarge"],
        min: given.heavy?.min ?? 2,
        max: given.heavy?.max ?? 6,
        slots: ["heavy", "light"],
      },
      light: {
        name: `${D.groupPrefix}-light`,
        purchase: "spot",
        instanceTypes: ["c7i.2xlarge", "c6i.2xlarge", "m7i.2xlarge"],
        min: given.light?.min ?? 1,
        max: given.light?.max ?? 4,
        slots: ["light"],
      },
    },
    disks: {
      root: { sizeGb: 40, type: "gp3", deviceName: "/dev/sda1" },
      data: {
        sizeGb: 200,
        type: "gp3",
        deviceName: "/dev/sdf",
        mount: D.dataMount,
        filesystem: "xfs",
      },
      deleteOnTermination: true,
    },
    guard: { ...D.guard },
    idleMinutes: D.idleMinutes,
    jobTimeoutHours: D.jobTimeoutHours,
    image: {
      schedule: D.imageSchedule,
      amiParameter: D.amiParameter,
      baseImageParameter: D.baseImageParameter,
    },
    toolchain: { ...TOOLCHAIN_PINS },
    secretGrants: {
      identityName: "figentra-ci-boxes",
      identityId: given.identityId,
      projects: grants,
    },
    tags: { groupKey: D.groupTagKey, environment: D.environmentTag, service: D.serviceTag },
  });
}
