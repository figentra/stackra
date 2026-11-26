/**
 * Stackra file contract:
 * Purpose: unit test of `GEN_REACHED_PORTS`: it names every port `pipelinePorts`, `replicaReadsPorts` and
 *          `systemDriverDefaults` can return, and every token of `SERVER_CONTRIBUTIONS`, so discovery never demotes a
 *          package whose driver gen binds without injection.
 * Boundary: test only; runs the functions on the commerce IR fixture with every option set.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-2584.
 */
import { describe, expect, it } from "@stackra/testing";

import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { GEN_REACHED_PORTS } from "#core/constants/gen-reached-ports.constant";
import { SERVER_CONTRIBUTIONS } from "#core/constants/server-contributions.constant";
import { pipelinePorts } from "#core/functions/pipeline-ports.function";
import { replicaReadsPorts } from "#core/functions/replica-reads-ports.function";
import { systemDriverDefaults } from "#core/functions/system-driver-defaults.function";
import type { MemberIR } from "#core/types/member-ir.type";

/** The fixture with every action option the pipeline reads and every package a system port needs. */
const EVERYTHING: MemberIR = {
  ...COMMERCE_IR,
  packages: [
    "@stackra/theming",
    "@stackra/platform",
    "@stackra/identity",
    "@stackra/app",
    "@stackra/actions",
  ],
  classes: COMMERCE_IR.classes.map((declared) =>
    declared.kind === "action"
      ? {
          ...declared,
          options: {
            ...declared.options,
            meter: {},
            offline: { cap: { count: 1 } },
            accepts: {},
            stepUp: "aal2",
          },
        }
      : declared.kind === "query"
        ? { ...declared, options: { ...declared.options, reads: "replica" } }
        : declared,
  ),
};

describe("GEN_REACHED_PORTS", () => {
  it("names every port the pipeline and the system defaults reach", () => {
    const reached = [...pipelinePorts(EVERYTHING), ...replicaReadsPorts(EVERYTHING)].map(
      (token) => token.class.name,
    );
    const system = [
      ...systemDriverDefaults({ ...EVERYTHING, layout: "service" }),
      ...systemDriverDefaults({ ...EVERYTHING, layout: "app", targets: ["web", "ios"] }),
    ].map((entry) => entry.port.name);
    expect(reached.length).toBeGreaterThan(5);
    for (const name of [...reached, ...system]) expect(GEN_REACHED_PORTS).toContain(name);
  });

  it("names every server contribution's token", () => {
    for (const contribution of SERVER_CONTRIBUTIONS)
      for (const dep of contribution.deps) expect(GEN_REACHED_PORTS).toContain(dep.name);
  });
});
