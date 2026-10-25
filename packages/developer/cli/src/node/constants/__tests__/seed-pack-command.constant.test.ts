/**
 * Stackra file contract:
 * Purpose: unit tests of `SEED_PACK_COMMAND`: `--check` reports each profile without loading a runner; a run plans the
 *          profile against the runner's state and writes only new and changed seed-owned records, never a record a
 *          tenant changed; a missing product is a usage error.
 * Boundary: test only; a throwaway pack in the OS temp directory and a fake runner, so no database is touched.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0325 (decision 7); config-model section 6.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SEED_PACK_COMMAND } from "#node/constants/seed-pack-command.constant";
import { CliUsageError } from "#node/errors/cli-usage.error";
import { captureIo } from "#node/functions/capture-io.function";
import { loadSeedRunner } from "#node/functions/load-seed-runner.function";
import type { CliContext } from "#node/types/cli-context.type";

vi.mock("#node/functions/load-seed-runner.function", () => ({ loadSeedRunner: vi.fn() }));

const seedState = vi.fn();
const applySeed = vi.fn();
let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-cli-"));
  const pack = join(root, "seed-packs/commerce");
  mkdirSync(join(pack, "profiles/minimal"), { recursive: true });
  mkdirSync(join(pack, "profiles/demo"), { recursive: true });
  writeFileSync(
    join(pack, "seed-pack.yaml"),
    "key: seed-pack:commerce\nproduct: commerce\nversion: 1.0.0\n",
  );
  writeFileSync(
    join(pack, "profiles/minimal/returns.yaml"),
    "kind: settings\nkey: returns\nrows:\n  - id: refund-window-days\n    answer: COM-160\n    value: 14\n",
  );
  writeFileSync(
    join(pack, "profiles/minimal/fees.yaml"),
    "kind: rule-set\nkey: rule-set:commerce:cod\nrows:\n  - id: fee\n    answer: COM-119\n    value: 0\n",
  );
  writeFileSync(
    join(pack, "profiles/demo/store.yaml"),
    "kind: brand-kit\nkey: brand-kit:demo\nrows:\n  - id: name\n    answer: OS-17\n    value: Demo\n",
  );
  mkdirSync(join(root, "services/commerce"), { recursive: true });
  seedState.mockReset();
  applySeed.mockReset();
  vi.mocked(loadSeedRunner).mockReset();
  vi.mocked(loadSeedRunner).mockResolvedValue({ seedState, applySeed });
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const run = (positionals: readonly string[], values: CliContext["values"] = {}) => {
  const { io, output } = captureIo();
  const code = SEED_PACK_COMMAND.run({
    cwd: join(root, "services/commerce"),
    io,
    values,
    positionals,
    rest: [],
    cli: async () => 0,
  });
  return { code, output };
};

describe("SEED_PACK_COMMAND", () => {
  it("checks the pack and reports each profile without a runner", async () => {
    const { code, output } = run(["commerce"], { check: true });
    expect(await code).toBe(0);
    expect(output()).toContain("seed-pack:commerce@1.0.0: valid");
    expect(output()).toContain("minimal  2 records, 2 rows");
    expect(output()).toContain("demo  3 records, 3 rows");
    expect(loadSeedRunner).not.toHaveBeenCalled();
  });

  it("writes new records and keeps the ones a tenant changed", async () => {
    seedState.mockResolvedValue([
      { kind: "settings", key: "returns", owner: "tenant", hash: "edited" },
    ]);
    applySeed.mockResolvedValue({
      written: ["rule-set:rule-set:commerce:cod", "brand-kit:brand-kit:demo"],
    });
    const { code, output } = run(["commerce"], { profile: "demo", env: "preview" });
    expect(await code).toBe(0);
    expect(seedState).toHaveBeenCalledWith({
      cwd: join(root, "services/commerce"),
      environment: "preview",
      pack: "seed-pack:commerce",
    });
    const call = applySeed.mock.calls[0]?.[0] as {
      records: { key: string }[];
      profile: string;
      version: string;
    };
    expect(call.profile).toBe("demo");
    expect(call.version).toBe("1.0.0");
    expect(call.records.map((record) => record.key)).toEqual([
      "rule-set:commerce:cod",
      "brand-kit:demo",
    ]);
    expect(output()).toContain("2 new, 0 updated, 0 current, 1 kept");
  });

  it("refuses a missing product", async () => {
    await expect(run([]).code).rejects.toThrow(CliUsageError);
  });
});
