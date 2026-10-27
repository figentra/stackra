/**
 * Stackra file contract:
 * Purpose: unit tests of `EncoreCloudProviderDriver`: the plan pushes the commit to the region's branch on the
 *          `encore://` remote; apply runs it; verify and current read the branch; rollback force-pushes the earlier
 *          commit; a dedicated tenant deploys from its own branch; a missing branch and a bad app id are refused.
 * Boundary: test only; the command runner is a fake, nothing runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0352 (decision 3), ADR 0400.
 */
import { buildConfig } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { RunwayConfig } from "#config/runway.config";
import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { deployTargets } from "#core/functions/deploy-targets.function";
import { parseRunway } from "#core/functions/parse-runway.function";
import { DEPLOY_ROOT } from "#core/functions/__tests__/fixtures/deploy-root.fixture";
import type { DeployTarget } from "#core/types/deploy-target.type";
import { EncoreCloudProviderDriver } from "#node/drivers/encore-cloud-provider.driver";
import type { CommandRunner } from "#node/types/command-runner.type";

const SHA = "a".repeat(40);
const OLD = "b".repeat(40);

/** A runner that records each command and answers `ls-remote` with `head`. */
function fakeRunner(head: string | null): { run: CommandRunner; calls: string[] } {
  const calls: string[] = [];
  const run: CommandRunner = async (command, args) => {
    calls.push([command, ...args].join(" "));
    return args[0] === "ls-remote" && head !== null ? `${head}\trefs/heads/x\n` : "";
  };
  return { run, calls };
}

/** The provider of the `acme` app, running its commands through `run`. */
function encore(run: CommandRunner): EncoreCloudProviderDriver {
  const config = buildConfig(RunwayConfig, { values: { encoreApp: "acme" } });
  return Object.assign(new EncoreCloudProviderDriver(config), { run });
}

const [ksa, firm] = deployTargets(DEPLOY_ROOT, "production") as [DeployTarget, DeployTarget];

describe("EncoreCloudProviderDriver", () => {
  it("plans a push of the commit to the region's branch", () => {
    const driver = encore(fakeRunner(null).run);
    expect(driver.destination).toBe("encore-cloud");
    expect(driver.plan(ksa, SHA)).toEqual([
      { command: "git", args: ["push", "encore://acme", `${SHA}:refs/heads/ksa`] },
    ]);
    expect(driver.plan(firm, SHA)[0]?.args.at(-1)).toBe(`${SHA}:refs/heads/firm`);
  });

  it("applies, verifies and reads the branch", async () => {
    const { run, calls } = fakeRunner(SHA);
    const driver = encore(run);

    const record = await driver.apply(ksa, SHA);

    expect(record).toEqual({ target: "production/services/ksa", sha: SHA, reference: SHA });
    expect(await driver.verify(ksa, record)).toEqual({ status: "up" });
    expect(await driver.current(ksa)).toBe(SHA);
    expect(calls[0]).toBe(`git push encore://acme ${SHA}:refs/heads/ksa`);
  });

  it("reports down when the branch holds another commit", async () => {
    const driver = encore(fakeRunner(OLD).run);
    expect(await driver.verify(ksa, { target: ksa.id, sha: SHA, reference: SHA })).toEqual({
      status: "down",
      detail: `ksa points to ${OLD}, not ${SHA}`,
    });
  });

  it("rolls back by force-pushing the earlier commit", async () => {
    const { run, calls } = fakeRunner(OLD);
    const driver = encore(run);
    const record = await driver.rollback(ksa, { target: ksa.id, sha: OLD, reference: OLD });
    expect(calls).toEqual([`git push encore://acme +${OLD}:refs/heads/ksa`]);
    expect(record.sha).toBe(OLD);
  });

  it("refuses a target without a branch and a bad app id", () => {
    const root = parseRunway("root", {
      version: 3,
      project: "acme",
      environments: { staging: { destinations: { services: "encore-cloud" } } },
    });
    const [target] = deployTargets(root, "staging") as [DeployTarget];
    const driver = encore(fakeRunner(null).run);
    expect(() => driver.plan(target, SHA)).toThrow(RunwayInvalidError);
    expect(() => buildConfig(RunwayConfig, { values: { encoreApp: "Acme App" } })).toThrow();
    expect(() => new EncoreCloudProviderDriver(buildConfig(RunwayConfig))).toThrow(TypeError);
  });
});
