/**
 * Stackra file contract:
 * Purpose: unit tests of `upgradeStepRuns`: `pnpm install` first only when a pin moved, a root step once, a service
 *          step in each service, the same command asked twice in a folder run once, and `stackra gen` last.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0199 (decision 2); STA-145.
 */
import { describe, expect, it } from "@stackra/testing";

import { upgradeStepRuns } from "#node/upgrade/functions/upgrade-step-runs.function";
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

const base = { title: "t", note: "n", source: "s" };

describe("upgradeStepRuns", () => {
  it("runs the install, each step in its folders once, then gen", () => {
    const codemods: UpgradeCodemod[] = [
      {
        ...base,
        id: "one",
        version: "0.30.0",
        steps: [{ command: ["stackra", "encore:prepare"], in: "services" }],
      },
      {
        ...base,
        id: "two",
        version: "0.31.0",
        steps: [{ command: ["stackra", "db", "diff"], in: "root" }],
      },
      {
        ...base,
        id: "three",
        version: "0.33.0",
        steps: [{ command: ["stackra", "encore:prepare"], in: "services" }],
      },
    ];
    expect(upgradeStepRuns(codemods, ["services/a", "services/b"])).toEqual([
      { command: ["pnpm", "install"], cwd: ".", why: ["install"] },
      {
        command: ["pnpm", "exec", "stackra", "encore:prepare"],
        cwd: "services/a",
        why: ["one", "three"],
      },
      {
        command: ["pnpm", "exec", "stackra", "encore:prepare"],
        cwd: "services/b",
        why: ["one", "three"],
      },
      { command: ["pnpm", "exec", "stackra", "db", "diff"], cwd: ".", why: ["two"] },
      { command: ["pnpm", "exec", "stackra", "gen"], cwd: ".", why: ["gen"] },
    ]);
  });

  it("always installs first, and skips a service step when there is no service", () => {
    const codemods: UpgradeCodemod[] = [
      {
        ...base,
        id: "one",
        version: "0.30.0",
        steps: [{ command: ["stackra", "encore:prepare"], in: "services" }],
      },
    ];
    expect(upgradeStepRuns(codemods, [])).toEqual([
      { command: ["pnpm", "install"], cwd: ".", why: ["install"] },
      { command: ["pnpm", "exec", "stackra", "gen"], cwd: ".", why: ["gen"] },
    ]);
  });
});
