/**
 * Stackra file contract:
 * Purpose: unit tests of `MintlifyProviderDriver`: the plan builds and checks the site, commits it as one orphan
 *          commit with the `Source:` trailer and force-pushes it to the deploy branch; apply refuses another
 *          checkout and runs the plan; verify and current read the trailer back (null when the branch is missing);
 *          rollback refuses; a target without a valid `branch` setting is refused.
 * Boundary: test only; the command runner is a fake, nothing runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0352 (decision 3); ADR 0002 (2026-10-27 amendment); STA-1316.
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import type { DeployTarget } from "#core/types/deploy-target.type";
import { MintlifyProviderDriver } from "#node/drivers/mintlify-provider.driver";
import type { CommandRunner } from "#node/types/command-runner.type";

const SHA = "a".repeat(40);

const DOCS: DeployTarget = {
  id: "production/docs",
  environment: "production",
  kind: "docs",
  destination: "mintlify",
  settings: { branch: "docs-site" },
  scope: {},
};

/** A runner that records each command and answers it from `answers`, keyed by the first two words. */
function fakeRunner(answers: Record<string, string>): { run: CommandRunner; calls: string[] } {
  const calls: string[] = [];
  const run: CommandRunner = async (command, args, options) => {
    calls.push(`${options.cwd ?? "."}$ ${[command, ...args].join(" ")}`);
    const answer = answers[`${command} ${args[0] ?? ""}`];
    if (answer === "throw") throw new Error("failed");
    return answer ?? "";
  };
  return { run, calls };
}

describe("MintlifyProviderDriver", () => {
  it("plans the checks, the orphan site commit and the push to the deploy branch", () => {
    const driver = new MintlifyProviderDriver({ projectDir: "apps/docs" });
    expect(
      driver
        .plan(DOCS, SHA)
        .map((step) => `${step.cwd ?? "."}$ ${[step.command, ...step.args].join(" ")}`),
    ).toEqual([
      "apps/docs$ stackra build",
      "apps/docs$ stackra lint",
      "apps/docs/.stackra/site$ git init --quiet --initial-branch docs-site",
      "apps/docs/.stackra/site$ git add --all",
      `apps/docs/.stackra/site$ git -c user.name=stackra-runway -c user.email=runway@users.noreply.github.com commit --quiet --message docs: site of ${SHA}\n\nSource: ${SHA}`,
      ".$ git fetch --quiet --force apps/docs/.stackra/site docs-site:refs/heads/docs-site",
      ".$ git push --quiet --force origin refs/heads/docs-site",
    ]);
  });

  it("applies from the release checkout and verifies by the trailer", async () => {
    const { run, calls } = fakeRunner({ "git rev-parse": `${SHA}\n`, "git log": `${SHA}\n` });
    const driver = new MintlifyProviderDriver({ projectDir: "apps/docs", run });
    const record = await driver.apply(DOCS, SHA);
    expect(record).toEqual({ target: "production/docs", sha: SHA, reference: "docs-site" });
    expect(calls).toHaveLength(8);
    expect(await driver.verify(DOCS, record)).toEqual({ status: "up" });
  });

  it("refuses another checkout", async () => {
    const { run } = fakeRunner({ "git rev-parse": "b".repeat(40) });
    const driver = new MintlifyProviderDriver({ projectDir: "apps/docs", run });
    await expect(driver.apply(DOCS, SHA)).rejects.toThrow(RunwayUnresolvedError);
  });

  it("has no current site when the branch is missing, and refuses a rollback", async () => {
    const { run } = fakeRunner({ "git fetch": "throw" });
    const driver = new MintlifyProviderDriver({ projectDir: "apps/docs", run });
    expect(await driver.current(DOCS)).toBeNull();
    expect(
      (await driver.verify(DOCS, { target: DOCS.id, sha: SHA, reference: "docs-site" })).status,
    ).toBe("down");
    await expect(
      driver.rollback(DOCS, { target: DOCS.id, sha: SHA, reference: "docs-site" }),
    ).rejects.toThrow(/promote/);
  });

  it("refuses a target without a deploy branch", () => {
    const driver = new MintlifyProviderDriver({ projectDir: "apps/docs" });
    expect(() => driver.plan({ ...DOCS, settings: {} }, SHA)).toThrow(RunwayInvalidError);
    expect(() => driver.plan({ ...DOCS, settings: { branch: "../main" } }, SHA)).toThrow(
      RunwayInvalidError,
    );
  });
});
