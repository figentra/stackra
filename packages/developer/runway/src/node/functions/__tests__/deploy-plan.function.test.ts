/**
 * Stackra file contract:
 * Purpose: unit tests of `deployPlan` and `readRunways`: the build-order targets with their workflows, the CI names and
 *          the names to sync, never a value; and the repository's own runway, whose caller workflows all exist.
 * Boundary: test only; reads this repository's runways, writes nothing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0170; STA-268.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { deployPlan } from "#node/functions/deploy-plan.function";
import { readRunways } from "#node/functions/read-runways.function";
import { repositoryRoot } from "#node/functions/repository-root.function";

import { MEMBERS, ROOT_RUNWAY } from "./fixtures/deploy-runways.fixture";

describe("deployPlan", () => {
  it("lists build-order targets with their workflows, the CI names and the names to sync, never a value", () => {
    const p = deployPlan("production", { root: ROOT_RUNWAY, members: MEMBERS });
    expect(p.infisicalEnvironment).toBe("prod");
    expect(p.steps.map(({ target, destination }) => [target, destination])).toEqual([
      ["npm", false],
      ["cloudflare-workers", true],
      ["mintlify", true],
    ]);
    expect(p.ci).toEqual(["CLOUDFLARE_API_TOKEN"]);
    expect(p.sync).toEqual([
      { member: "web", kind: "secret", name: "SENTRY_AUTH", path: "/runtime" },
      { member: "web", kind: "var", name: "VITE_API_ORIGIN" },
    ]);
    expect(JSON.stringify(p).includes("api.acme.example")).toBe(false);
    expect(() => deployPlan("staging", { root: ROOT_RUNWAY, members: [] })).toThrow(
      /no environment "staging"/,
    );
  });

  it("reads the repository's own runway: every caller workflow exists, and production deploys the static Worker and the docs", () => {
    const repo = repositoryRoot();
    const runways = readRunways(repo);
    const p = deployPlan("production", runways);
    for (const { workflows } of p.steps)
      for (const file of Object.values(workflows))
        expect(existsSync(join(repo, ".github/workflows", file)), file).toBe(true);
    expect(p.steps.filter((s) => s.destination).map((s) => s.target)).toEqual([
      "cloudflare-workers",
      "mintlify",
    ]);
    expect(runways.members.map((m) => m.member)).toEqual(["docs"]);
  });
});
