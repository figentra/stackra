/**
 * Stackra file contract:
 * Purpose: unit tests of `checkDevPorts`: distinct ports on every lane pass; the STA-863 collisions fail with both
 *          owners named (lane 10's otel UI on lane 0's gateway, lane 7's docs on a service port); a pair is reported
 *          once; two owners of one port fail without lanes; a lane offset past 65535 fails; and lanes off means lane 0
 *          only.
 * Boundary: test only; runways are built through `parseRunway`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-863; ADR 0296 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { checkDevPorts } from "#core/functions/check-dev-ports.function";
import { parseRunway } from "#core/functions/parse-runway.function";
import type { AppRunway } from "#core/types/app-runway.type";
import type { RootRunway } from "#core/types/root-runway.type";
import type { ServiceRunway } from "#core/types/service-runway.type";

/** A root runway whose dev environment has these containers and lanes. */
function rootWith(infra: Record<string, unknown>, lanes?: Record<string, unknown>): RootRunway {
  return parseRunway("root", {
    version: 3,
    project: "os",
    environments: { dev: { infra, ...(lanes === undefined ? {} : { lanes }) } },
  });
}

/** An app runway with this dev port. */
function app(port: number): AppRunway {
  return parseRunway("app", { version: 3, environments: { dev: { port } } });
}

/** A service runway with this dev port. */
function service(port: number): ServiceRunway {
  return parseRunway("service", { version: 3, environments: { dev: { port } } });
}

const INFRA = { gateway: { port: 4000, dashboard: 9400 }, "otel-lgtm": { uiPort: 3000 } };
const LANES = {
  enabled: true,
  portStep: 100,
  from: "STACKRA_LANE",
  repoIndex: { os: 0, commerce: 1 },
  worktrees: 10,
};

describe("checkDevPorts", () => {
  it("passes distinct ports on every lane", () => {
    const root = rootWith({ gateway: { port: 4000 } }, { ...LANES, repoIndex: { os: 0 } });

    expect(checkDevPorts(root, { "apps/web": app(5175) })).toEqual([]);
  });

  it("names both owners when lane 10's otel UI lands on lane 0's gateway, once per pair", () => {
    const issues = checkDevPorts(rootWith(INFRA, LANES), {});

    expect(issues).toEqual([
      {
        code: "dev_port_duplicate",
        port: 4000,
        owners: [
          "runway.yaml infra.gateway.port on lane 0",
          "runway.yaml infra.otel-lgtm.uiPort on lane 10",
        ],
        message:
          "dev port 4000 is taken twice: runway.yaml infra.gateway.port on lane 0 and runway.yaml infra.otel-lgtm.uiPort on lane 10",
      },
    ]);
  });

  it("names a member collision across repositories (lane 7 docs on a service port)", () => {
    const root = rootWith({}, { ...LANES, repoIndex: { os: 0 }, worktrees: 8 });

    const [issue] = checkDevPorts(root, {
      "apps/docs": app(3333),
      "services/catalog": service(4033),
    });

    expect(issue?.owners).toEqual([
      "apps/docs environments.dev.port on lane 7",
      "services/catalog environments.dev.port on lane 0",
    ]);
  });

  it("fails two owners of one port with lanes off", () => {
    const issues = checkDevPorts(rootWith({ gateway: { port: 4000 } }), {
      "apps/console": app(4000),
    });

    expect(issues.map((issue) => issue.code)).toEqual(["dev_port_duplicate"]);
    expect(issues[0]?.owners).toEqual([
      "runway.yaml infra.gateway.port on lane 0",
      "apps/console environments.dev.port on lane 0",
    ]);
  });

  it("fails a port a lane pushes past 65535", () => {
    const root = rootWith({}, { ...LANES, repoIndex: { os: 0, academorix: 70 } });

    const issues = checkDevPorts(root, { "apps/web": app(5175) });

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ code: "dev_port_out_of_range", port: 75_175 });
  });
});
