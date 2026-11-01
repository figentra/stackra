/**
 * Stackra file contract:
 * Purpose: unit tests of `runDbSeed`: an unknown profile is a usage error; on production `demo`, `test` and `--again`
 *          are refused without `allowProduction`, and an allowed production run prints who ran it; a member without a
 *          seed entry has no seeders; otherwise the member is built, then its seed entry runs with the profile, module,
 *          `--again` and the actor, and a failed build stops there.
 * Boundary: test only; the member is a temp folder and the processes are replaced, so nothing is built or seeded.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0190; STA-1709.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { captureIo } from "#node/functions/capture-io.function";
import { runDbSeed } from "#node/functions/run-db-seed.function";
import { runProcess } from "#node/functions/run-process.function";

vi.mock("#node/functions/run-process.function", () => ({ runProcess: vi.fn() }));

let cwd: string;

beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), "stackra-db-seed-"));
  vi.mocked(runProcess).mockReset();
  vi.mocked(runProcess).mockResolvedValue(0);
  vi.stubEnv("STACKRA_ACTOR", "rana");
});

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
  vi.unstubAllEnvs();
});

/** Gives the member a seed entry. */
function withSeedEntry(): void {
  mkdirSync(join(cwd, ".stackra", "entry"), { recursive: true });
  writeFileSync(join(cwd, ".stackra", "entry", "seed.ts"), "");
}

describe(runDbSeed, () => {
  it("refuses an unknown profile", async () => {
    const { io } = captureIo();
    await expect(runDbSeed({ cwd, profile: "staging", environment: "dev", io })).rejects.toThrow(
      CliUsageError,
    );
  });

  it("refuses demo, test and --again on production unless allowed, and names who ran it", async () => {
    withSeedEntry();
    const { io, output } = captureIo();
    const production = { cwd, environment: "production", io };
    await expect(runDbSeed({ ...production, profile: "demo" })).rejects.toThrow(
      /--allow-production/,
    );
    await expect(runDbSeed({ ...production, profile: "test" })).rejects.toThrow(CliUsageError);
    await expect(runDbSeed({ ...production, profile: "minimal", again: true })).rejects.toThrow(
      /--again is refused/,
    );
    expect(runProcess).not.toHaveBeenCalled();
    expect(await runDbSeed({ ...production, profile: "demo", allowProduction: true })).toBe(0);
    expect(output()).toContain("db seed (production): demo, run by rana");
  });

  it("answers no seeders for a member without a seed entry", async () => {
    const { io, output } = captureIo();
    expect(await runDbSeed({ cwd, profile: "demo", environment: "dev", io })).toBe(0);
    expect(output()).toContain("db seed (dev): no seeders");
    expect(runProcess).not.toHaveBeenCalled();
  });

  it("builds the member, then runs its seed entry with the flags and the actor", async () => {
    withSeedEntry();
    const { io } = captureIo();
    expect(
      await runDbSeed({
        cwd,
        profile: "test",
        environment: "test",
        io,
        module: "orders",
        again: true,
      }),
    ).toBe(0);
    expect(vi.mocked(runProcess).mock.calls.map(([run]) => [run.command, run.args])).toEqual([
      ["tsdown", []],
      [
        process.execPath,
        [
          join("dist", "seed.mjs"),
          "--profile",
          "test",
          "--ran-by",
          "rana",
          "--module",
          "orders",
          "--again",
        ],
      ],
    ]);
    expect(vi.mocked(runProcess).mock.calls[1]?.[0].env).toEqual({ STACKRA_ENVIRONMENT: "test" });
  });

  it("stops when the build fails", async () => {
    withSeedEntry();
    vi.mocked(runProcess).mockResolvedValueOnce(2);
    const { io } = captureIo();
    expect(await runDbSeed({ cwd, profile: "minimal", environment: "dev", io })).toBe(2);
    expect(runProcess).toHaveBeenCalledTimes(1);
  });
});
