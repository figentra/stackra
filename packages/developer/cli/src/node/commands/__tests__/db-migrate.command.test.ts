/**
 * Stackra file contract:
 * Purpose: unit tests of `DbMigrateCommand` on the console: it runs the member's runner with the environment, lists
 *          what it applied (the `--json` data), passes `--release` through, else `STACKRA_RELEASE`, else the checkout's
 *          commit (the default deploy path names its release), says so when nothing is pending, targets dev by default
 *          and refuses an unknown environment with exit 2 before the runner loads; in a real git checkout it names
 *          that checkout's commit.
 * Boundary: test only; the runner is a fake, so no database is touched. The real checkout is a temporary repository
 *           with one commit, read by the console's own process runner.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159 (decision 2 as amended); ADR 0506; STA-1966.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { NodeProcessRunnerDriver } from "@stackra/console/node";
import { MemoryProcessRunnerDriver, runCommandForTest } from "@stackra/console/testing";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { DbMigrateCommand } from "#node/commands/db-migrate.command";
import { loadDatabaseRunner } from "#node/functions/load-database-runner.function";

vi.mock("#node/functions/load-database-runner.function", () => ({ loadDatabaseRunner: vi.fn() }));

const migrate = vi.fn();

beforeEach(() => {
  migrate.mockReset();
  vi.mocked(loadDatabaseRunner).mockReset();
  vi.mocked(loadDatabaseRunner).mockResolvedValue({ migrate, rollback: vi.fn() });
  vi.stubEnv("STACKRA_ENVIRONMENT", undefined);
  vi.stubEnv("STACKRA_RELEASE", undefined);
});

/** The commit a deploy's checkout is at. */
const HEAD = "4f1c2b0e9d8a7f6e5d4c3b2a1908f7e6d5c4b3a2";

/** A process runner whose `git rev-parse` answers `HEAD`, as in a deploy's checkout. */
const checkout = (): MemoryProcessRunnerDriver =>
  new MemoryProcessRunnerDriver().on("git rev-parse --verify --quiet HEAD", {
    output: `${HEAD}\n`,
  });

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("DbMigrateCommand", () => {
  it("applies the pending migrations in the member's folder and lists them", async () => {
    migrate.mockResolvedValue({ applied: ["0001_create_orders", "0002_add_status"] });
    const result = await runCommandForTest([DbMigrateCommand], ["db:migrate", "--env", "staging"]);
    expect(result.exitCode).toBe(0);
    expect(loadDatabaseRunner).toHaveBeenCalledWith("/work");
    expect(migrate).toHaveBeenCalledWith({ cwd: "/work", environment: "staging" });
    expect(result.stdout).toContain("applied 2");
    expect(result.stdout).toContain("0002_add_status");
  });

  it("passes --release to the runner, and no release when it is absent (STA-1406)", async () => {
    migrate.mockResolvedValue({ applied: ["0002_add_status"] });
    const result = await runCommandForTest(
      [DbMigrateCommand],
      ["db:migrate", "--env", "production", "--release", "v1.4.0"],
    );
    expect(result.exitCode).toBe(0);
    expect(migrate).toHaveBeenCalledWith({
      cwd: "/work",
      environment: "production",
      release: "v1.4.0",
    });
    migrate.mockClear();
    await runCommandForTest([DbMigrateCommand], ["db:migrate", "--env", "production"]);
    expect(migrate).toHaveBeenCalledWith({ cwd: "/work", environment: "production" });
  });

  it("names the checkout's commit as the release when neither --release nor STACKRA_RELEASE is given, so the default deploy path passes one (STA-1406)", async () => {
    migrate.mockResolvedValue({ applied: ["0002_add_status"] });
    const process = checkout();
    const result = await runCommandForTest(
      [DbMigrateCommand],
      ["db:migrate", "--env", "production"],
      {
        process,
      },
    );
    expect(result.exitCode).toBe(0);
    expect(process.calls.map((call) => [call.line, call.cwd])).toEqual([
      ["git rev-parse --verify --quiet HEAD", "/work"],
    ]);
    expect(migrate).toHaveBeenCalledWith({
      cwd: "/work",
      environment: "production",
      release: HEAD,
    });
  });

  it("names the commit of a real git checkout it runs in (STA-1406)", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "stackra-release-"));
    try {
      const git = (...args: string[]) =>
        execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
      git("init", "--quiet");
      git(
        "-c",
        "user.name=test",
        "-c",
        "user.email=test@example.com",
        "commit",
        "--quiet",
        "--allow-empty",
        "-m",
        "v",
      );
      migrate.mockResolvedValue({ applied: [] });
      await runCommandForTest([DbMigrateCommand], ["db:migrate", "--env", "production"], {
        cwd,
        process: new NodeProcessRunnerDriver(),
      });
      expect(migrate).toHaveBeenCalledWith({
        cwd,
        environment: "production",
        release: git("rev-parse", "HEAD").trim(),
      });
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("prefers --release, then STACKRA_RELEASE, over the checkout's commit (STA-1406)", async () => {
    migrate.mockResolvedValue({ applied: [] });
    await runCommandForTest(
      [DbMigrateCommand],
      ["db:migrate", "--env", "production", "--release", "v1.4.0"],
      { process: checkout() },
    );
    expect(migrate).toHaveBeenLastCalledWith({
      cwd: "/work",
      environment: "production",
      release: "v1.4.0",
    });
    vi.stubEnv("STACKRA_RELEASE", "2026.11.27-1");
    const process = checkout();
    await runCommandForTest([DbMigrateCommand], ["db:migrate", "--env", "production"], { process });
    expect(migrate).toHaveBeenLastCalledWith({
      cwd: "/work",
      environment: "production",
      release: "2026.11.27-1",
    });
    expect(process.calls).toEqual([]);
  });

  it("names no release outside a git checkout, leaving the runner to refuse a run that needs one (STA-1406)", async () => {
    migrate.mockResolvedValue({ applied: [] });
    const process = new MemoryProcessRunnerDriver().on("git rev-parse --verify --quiet HEAD", {
      code: 128,
    });
    await runCommandForTest([DbMigrateCommand], ["db:migrate", "--env", "production"], { process });
    expect(migrate).toHaveBeenCalledWith({ cwd: "/work", environment: "production" });
  });

  it("returns the environment and the applied names under --json", async () => {
    migrate.mockResolvedValue({ applied: ["0001_create_orders"] });
    const result = await runCommandForTest([DbMigrateCommand], ["db", "migrate", "--json"]);
    expect(result.json).toEqual({
      ok: true,
      data: { environment: "dev", applied: ["0001_create_orders"] },
    });
  });

  it("says so when nothing is pending", async () => {
    migrate.mockResolvedValue({ applied: [] });
    const result = await runCommandForTest(
      [DbMigrateCommand],
      ["db:migrate", "--env", "production"],
    );
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("no pending migrations");
  });

  it("refuses an unknown environment with exit 2 and loads no runner", async () => {
    const result = await runCommandForTest([DbMigrateCommand], ["db:migrate", "--env", "qa"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("unknown environment: qa");
    expect(loadDatabaseRunner).not.toHaveBeenCalled();
  });
});
