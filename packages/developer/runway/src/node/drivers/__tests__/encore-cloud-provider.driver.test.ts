/**
 * Stackra file contract:
 * Purpose: unit tests of `EncoreCloudProviderDriver`: the plan pushes the commit to the region's branch on the
 *          `encore://` remote; apply runs it; verify and current read the branch; verify then reads `<origin>/readyz`
 *          when the target names an origin, polling with backoff while Encore builds (up on 2xx; down with the last
 *          answer once `encore.readyTimeoutMinutes` passes; never throws); rollback
 *          force-pushes the earlier commit; a dedicated tenant deploys from its own branch; a missing branch and a bad
 *          app id are refused.
 * Boundary: test only; the command runner and fetch are fakes, nothing runs.
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

/** A driver whose waits move a fake clock instead of sleeping; `waits` records each one. */
function polling(statuses: number[]): {
  driver: EncoreCloudProviderDriver;
  urls: string[];
  waits: number[];
} {
  const driver = encore(fakeRunner(SHA).run);
  const urls: string[] = [];
  const waits: number[] = [];
  let clock = 0;
  driver.now = () => clock;
  driver.sleep = async (ms) => {
    waits.push(ms);
    clock += ms;
  };
  driver.fetch = async (input) => {
    urls.push(String(input));
    return new Response(null, { status: statuses.shift() ?? 503 });
  };
  return { driver, urls, waits };
}

const ready = (encoreBlock: Record<string, unknown> = {}): DeployTarget => ({
  ...ksa,
  scope: {
    encore: {
      branch: "main",
      regions: { ksa: { branch: "ksa", origin: "https://ksa.acme.test/" } },
      ...encoreBlock,
    },
  },
});
const RECORD = { target: ksa.id, sha: SHA, reference: SHA };

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

  it("verifies /readyz on the target's origin", async () => {
    const { driver, urls, waits } = polling([200]);

    expect(await driver.verify(ready(), RECORD)).toEqual({ status: "up" });
    expect(urls).toEqual(["https://ksa.acme.test/readyz"]);
    expect(waits).toEqual([]);
  });

  /** Encore builds after the push: "application not found" (404) and 5xx answers mean it is still building. */
  it("polls /readyz with backoff while Encore builds, until it answers", async () => {
    const { driver, urls, waits } = polling([404, 404, 503, 200]);

    expect(await driver.verify(ready(), RECORD)).toEqual({ status: "up" });
    expect(urls).toHaveLength(4);
    expect(waits).toEqual([5000, 10_000, 20_000]);
  });

  /** The timeout is a setting; at the deadline the last answer is the reason. */
  it("reports down with the last answer once encore.readyTimeoutMinutes passes", async () => {
    const { driver, waits } = polling([]);

    expect(await driver.verify(ready({ readyTimeoutMinutes: 2 }), RECORD)).toEqual({
      status: "down",
      detail: "https://ksa.acme.test/readyz answered 503",
    });
    // The next wait, 60 s after 75 s of waits, would pass the 2-minute deadline.
    expect(waits).toEqual([5000, 10_000, 20_000, 40_000]);

    const unreachable = polling([]);
    unreachable.driver.fetch = async () => {
      throw new TypeError("fetch failed");
    };
    expect(await unreachable.driver.verify(ready({ readyTimeoutMinutes: 0 }), RECORD)).toEqual({
      status: "down",
      detail: "https://ksa.acme.test/readyz failed: TypeError",
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
