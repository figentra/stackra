/**
 * Stackra file contract:
 * Purpose: unit tests of `EasProviderDriver`: a build target plans and starts `eas build` of the channel's profile
 *          from the release checkout, verifies by the build status and refuses a rollback; an update target publishes
 *          to the channel, verifies the group and republishes the earlier group; a checkout of another commit and an
 *          environment without a channel are refused; submit sends a build of the platform EAS reports to its store,
 *          and falls back to `--platform all` on an unreadable answer.
 * Boundary: test only; the command runner is a fake, nothing runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0352 (decision 3), ADR 0180, ADR 0344, ADR 0482.
 */
import { buildConfig } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { RunwayConfig } from "#config/runway.config";
import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { deployTargets } from "#core/functions/deploy-targets.function";
import { DEPLOY_ROOT } from "#core/functions/__tests__/fixtures/deploy-root.fixture";
import type { DeployTarget } from "#core/types/deploy-target.type";
import { EasProviderDriver } from "#node/drivers/eas-provider.driver";
import type { CommandRunner } from "#node/types/command-runner.type";

const SHA = "a".repeat(40);

/** A runner that records each command and answers it from `answers`, keyed by the first two words. */
function fakeRunner(answers: Record<string, string>): { run: CommandRunner; calls: string[] } {
  const calls: string[] = [];
  const run: CommandRunner = async (command, args) => {
    calls.push([command, ...args].join(" "));
    return answers[`${command} ${args[0] ?? ""}`] ?? "";
  };
  return { run, calls };
}

/** The provider over the default runway config, running its commands through `run`. */
function eas(run: CommandRunner): EasProviderDriver {
  return Object.assign(new EasProviderDriver(buildConfig(RunwayConfig)), { run });
}

const mobile = deployTargets(DEPLOY_ROOT, "production").find(
  (target) => target.kind === "mobile",
) as DeployTarget;
const update: DeployTarget = { ...mobile, settings: { release: "update" } };

describe("EasProviderDriver", () => {
  it("starts a build of the channel's profile from the release checkout", async () => {
    const { run, calls } = fakeRunner({
      "git rev-parse": `${SHA}\n`,
      "eas build": JSON.stringify([{ id: "build-ios" }, { id: "build-android" }]),
      "eas build:view": JSON.stringify({ status: "FINISHED" }),
    });
    const driver = eas(run);

    const record = await driver.apply(mobile, SHA);

    expect(calls[1]).toBe(
      "eas build --profile production --platform all --non-interactive --no-wait --json",
    );
    expect(record).toEqual({
      target: "production/mobile/ksa",
      sha: SHA,
      reference: "build-ios,build-android",
    });
    expect(await driver.verify(mobile, record)).toEqual({ status: "up" });
  });

  it("reports a running build as degraded and a failed one as down", async () => {
    const running = eas(
      fakeRunner({ "eas build:view": JSON.stringify({ status: "IN_PROGRESS" }) }).run,
    );
    const record = { target: mobile.id, sha: SHA, reference: "build-ios" };
    expect((await running.verify(mobile, record)).status).toBe("degraded");
    const failed = eas(fakeRunner({ "eas build:view": JSON.stringify({ status: "ERRORED" }) }).run);
    expect((await failed.verify(mobile, record)).status).toBe("down");
  });

  it("publishes an update and rolls back by republishing the earlier group", async () => {
    const { run, calls } = fakeRunner({
      "git rev-parse": SHA,
      "eas update": JSON.stringify([{ group: "group-2" }, { group: "group-2" }]),
      "eas update:republish": JSON.stringify([{ group: "group-3" }]),
      "eas update:list": JSON.stringify({ currentPage: [{ gitCommitHash: SHA }] }),
    });
    const driver = eas(run);

    const record = await driver.apply(update, SHA);
    const back = await driver.rollback(update, {
      target: update.id,
      sha: "b".repeat(40),
      reference: "group-1",
    });

    expect(record.reference).toBe("group-2");
    expect(calls).toContain(
      `eas update --channel production --message ${SHA} --non-interactive --json`,
    );
    expect(calls).toContain("eas update:republish --group group-1 --non-interactive --json");
    expect(back).toEqual({ target: update.id, sha: "b".repeat(40), reference: "group-3" });
    expect(await driver.current(update)).toBe(SHA);
  });

  it("refuses another checkout, a store build rollback and a missing channel", async () => {
    const driver = eas(fakeRunner({ "git rev-parse": "b".repeat(40) }).run);
    await expect(driver.apply(mobile, SHA)).rejects.toThrow(RunwayUnresolvedError);
    await expect(
      driver.rollback(mobile, { target: mobile.id, sha: SHA, reference: "x" }),
    ).rejects.toThrow(RunwayUnresolvedError);
    expect(() => driver.plan({ ...mobile, scope: {} }, SHA)).toThrow(RunwayInvalidError);
  });
});

describe("EasProviderDriver submit", () => {
  // @covers sta-1623:FR-008
  it("submits a finished build of the platform EAS reports on the production submit profile", async () => {
    const { run, calls } = fakeRunner({ "eas build:view": JSON.stringify({ platform: "IOS" }) });

    const platform = await eas(run).submit("build-ios");

    expect(platform).toBe("ios");
    expect(calls).toEqual([
      "eas build:view build-ios --json",
      "eas submit --platform ios --id build-ios --profile production --non-interactive --json",
    ]);
  });

  it("submits with --platform all when the build answer cannot be read", async () => {
    const { run, calls } = fakeRunner({ "eas build:view": "not json" });

    expect(await eas(run).submit("build-x", "production")).toBe("all");
    expect(calls[1]).toContain("--platform all");
  });
});
