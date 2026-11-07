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
    expect(p.secretScope).toBe("products/acme/production");
    expect(p.steps.map(({ target, destination }) => [target, destination])).toEqual([
      ["npm", false],
      ["cloudflare-workers", true],
      ["mintlify", true],
    ]);
    expect(p.ci).toEqual(["CLOUDFLARE_API_TOKEN"]);
    expect(p.sync).toEqual([
      { member: "web", kind: "secret", name: "SENTRY_AUTH" },
      { member: "web", kind: "var", name: "VITE_API_ORIGIN" },
    ]);
    expect(JSON.stringify(p).includes("api.acme.example")).toBe(false);
    expect(() => deployPlan("staging", { root: ROOT_RUNWAY, members: [] })).toThrow(
      /no environment "staging"/,
    );
  });

  it("names the sops scope by environment: a preview reads dev's, and no project means no scope (ADR 0525)", () => {
    const unnamed = {
      providers: ROOT_RUNWAY.providers,
      environments: { preview: {}, staging: {}, production: {} },
    };
    const root = { ...unnamed, project: "acme" };
    expect(deployPlan("preview", { root, members: [] }).secretScope).toBe("products/acme/dev");
    expect(deployPlan("staging", { root, members: [] }).secretScope).toBe("products/acme/staging");
    expect(deployPlan("staging", { root: unnamed, members: [] }).secretScope).toBeNull();
  });

  it("syncs the names a member's manifest declares for the environment beside its runway secrets (STA-2104)", () => {
    const [web] = MEMBERS;
    if (web === undefined) throw new Error("fixture has no member");
    const p = deployPlan("production", {
      root: ROOT_RUNWAY,
      members: [
        {
          ...web,
          env: [
            { name: "SENTRY_AUTH" },
            { name: "API_ORIGIN" },
            { name: "STAGING_ONLY", environments: ["staging"] },
            { name: "VITE_API_ORIGIN", kind: "public" },
          ],
        },
      ],
    });
    expect(p.sync.filter((entry) => entry.kind === "secret").map((entry) => entry.name)).toEqual([
      "SENTRY_AUTH",
      "API_ORIGIN",
    ]);
  });

  it("reads the repository's own runway: every caller workflow exists, and production deploys the static Worker and the docs", () => {
    const repo = repositoryRoot();
    const runways = readRunways(repo);
    const p = deployPlan("production", runways);
    for (const { workflows } of p.steps)
      for (const file of Object.values(workflows))
        expect(existsSync(join(repo, ".github/workflows", file)), file).toBe(true);
    // The docs are a Cloudflare Worker since the Fumadocs move (ADR 0514, STA-2026): no Mintlify target is left.
    expect(p.steps.filter((s) => s.destination).map((s) => s.target)).toEqual([
      "cloudflare-workers",
    ]);
    expect(new Set(runways.members.map((m) => m.member))).toEqual(
      new Set([
        "console",
        "docs",
        "mobile",
        "playground",
        "example",
        "health",
        "edge",
        "env-sync",
        "registry",
        "static",
        "turbo-cache",
      ]),
    );
  });
});
