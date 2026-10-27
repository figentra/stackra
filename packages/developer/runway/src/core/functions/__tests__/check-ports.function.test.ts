/**
 * Stackra file contract:
 * Purpose: unit tests of `checkPorts`: lane 0 alone without a table; the redundancy challenge's own collision (lane
 *          10's otel UI on lane 0's gateway) named with both owners; a member port against infra; a `perLane: false`
 *          port shared by every lane; a port pushed past 65535; and the full D1 table through academorix (index 7).
 * Boundary: test only; builds root and member runways through `parseRunway`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-863; redundancy challenge item 5; D1 (repository index).
 */
import { describe, expect, it } from "@stackra/testing";

import { checkPorts } from "#core/functions/check-ports.function";
import { parseRunway } from "#core/functions/parse-runway.function";

/** The D1 repository index table. */
const D1 = {
  os: 0,
  commerce: 1,
  organza: 2,
  jute: 3,
  mezzora: 4,
  beautilon: 5,
  juristra: 6,
  academorix: 7,
};

/** A root runway whose dev environment has the given infra and lanes. */
function root(infra: Record<string, unknown>, lanes?: Record<string, unknown>) {
  return parseRunway("root", {
    version: 3,
    project: "acme-platform",
    environments: { dev: { infra, ...(lanes && { lanes }) } },
  });
}

/** A member runway with the given dev environment. */
function app(dev: Record<string, unknown>) {
  return parseRunway("app", { version: 3, environments: { dev } });
}

describe("checkPorts", () => {
  it("checks lane 0 alone when there is no table, and passes distinct ports", () => {
    const issues = checkPorts(root({ gateway: { port: 4000, dashboard: 9400 } }), {
      console: app({ port: 5173 }),
    });

    expect(issues).toEqual([]);
  });

  it("names both owners when lane 10's otel UI lands on lane 0's gateway", () => {
    const issues = checkPorts(
      root(
        { gateway: { port: 4000 }, "otel-lgtm": { uiPort: 3000 } },
        { enabled: true, portStep: 100, repos: { os: 0, commerce: 1 } },
      ),
      {},
    );

    expect(issues).toContainEqual(
      expect.objectContaining({
        code: "duplicate_port",
        port: 4000,
        owners: [
          "os worktree 0 (lane 0) infra.gateway.port",
          "commerce worktree 0 (lane 10) infra.otel-lgtm.uiPort",
        ],
      }),
    );
  });

  it("fails a member port that equals an infra port", () => {
    const issues = checkPorts(root({ gateway: { port: 4000 } }), { docs: app({ port: 4000 }) });

    expect(issues).toEqual([
      expect.objectContaining({
        code: "duplicate_port",
        owners: ["lane 0 infra.gateway.port", "lane 0 docs.port"],
      }),
    ]);
  });

  it("claims a perLane: false port once for every lane", () => {
    const issues = checkPorts(
      root(
        { postgres: { port: 5432, perLane: false }, gateway: { port: 5332 } },
        { portStep: 100, repos: { os: 0 }, worktrees: 2 },
      ),
      {},
    );

    expect(issues).toEqual([
      expect.objectContaining({
        port: 5432,
        owners: [
          "infra.postgres.port (shared by every lane)",
          "os worktree 1 (lane 1) infra.gateway.port",
        ],
      }),
    ]);
  });

  it("refuses a port a lane pushes past 65535", () => {
    const issues = checkPorts(root({}, { portStep: 100, repos: { os: 0 }, worktrees: 2 }), {
      console: app({ port: 65_500 }),
    });

    expect(issues).toEqual([expect.objectContaining({ code: "port_out_of_range", port: 65_600 })]);
  });

  it("walks every lane of the D1 table through academorix", () => {
    const issues = checkPorts(root({ gateway: { port: 4000 } }, { portStep: 100, repos: D1 }), {
      console: app({ port: 11_900 }),
    });

    expect(issues).toEqual([
      expect.objectContaining({
        code: "duplicate_port",
        port: 11_900,
        owners: [
          "os worktree 0 (lane 0) console.port",
          "academorix worktree 9 (lane 79) infra.gateway.port",
        ],
      }),
    ]);
  });

  it("ignores the table when lanes are off", () => {
    const issues = checkPorts(
      root(
        { gateway: { port: 4000 }, "otel-lgtm": { uiPort: 3000 } },
        { enabled: false, portStep: 100, repos: D1 },
      ),
      {},
    );

    expect(issues).toEqual([]);
  });
});
