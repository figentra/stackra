/**
 * Stackra file contract:
 * Purpose: unit tests of `ConsumerGateCommand` on the console: the flags reach `runConsumerGate` resolved against the
 *          working directory with the default matrix and allow-list and the reproduce line, its exit code is the
 *          command's, the Markdown summary is printed (the summary is the `--json` data), and a missing flag, a bad
 *          `--today`, `--mode` or step, or an unreadable matrix exits 2 before anything runs.
 * Boundary: test only; `runConsumerGate` is mocked, so no product is built; the matrix and allow-list are throwaway
 *           files in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); spec `.agents/specs/sta-1813-product-gate`; STA-1966.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runCommandForTest } from "@stackra/console/testing";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { ConsumerGateCommand } from "#node/commands/consumer-gate.command";
import { runConsumerGate } from "#node/consumer-gate/functions/run-consumer-gate.function";
import type { ConsumerGateSummary } from "#node/consumer-gate/types/consumer-gate-summary.type";

vi.mock("#node/consumer-gate/functions/run-consumer-gate.function", () => ({
  runConsumerGate: vi.fn(),
}));

const SUMMARY: ConsumerGateSummary = {
  product: "billing",
  key: "billing@1139925",
  mode: "link",
  verdict: "GREEN",
  date: "2026-11-01",
  ref: "1139925",
  core: { dir: "/core", sha: "abc" },
  checkout: { sha: "1139925" },
  steps: [],
  problems: [],
  environment: {
    coreCommit: "abc",
    productRef: "1139925",
    mode: "link",
    node: "24.22.0",
    pnpm: "12.0.0",
    gen: "0.9.0",
    lockfileBefore: undefined,
    lockfileAfter: undefined,
    overlays: {},
    reproduce: "stackra consumer-gate",
  },
};

const REQUIRED = [
  "--core",
  "core",
  "--checkout",
  "product",
  "--product",
  "billing",
  "--out",
  "out",
];

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-consumer-gate-"));
  mkdirSync(join(root, "tools", "consumer-gate"), { recursive: true });
  writeFileSync(
    join(root, "tools", "consumer-gate", "matrix.yaml"),
    "products:\n  billing:\n    repo: figentra/billing\n    ref: '1139925'\n    services: [billing]\n",
  );
  writeFileSync(join(root, "tools", "consumer-gate", "allow.yaml"), "allow: []\n");
  vi.mocked(runConsumerGate).mockReset();
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const gate = (args: string[]) =>
  runCommandForTest([ConsumerGateCommand], ["consumer-gate", ...args], { cwd: root });

describe("ConsumerGateCommand", () => {
  it("runs the gate with resolved paths and the defaults, prints the summary and keeps its exit code", async () => {
    vi.mocked(runConsumerGate).mockReturnValue({ code: 1, summary: SUMMARY });
    const result = await gate([...REQUIRED, "--steps", "gen,typecheck", "--today", "2026-11-01"]);
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("# Consumer gate: billing (GREEN)");
    const [options] = vi.mocked(runConsumerGate).mock.calls[0] ?? [];
    expect(options).toMatchObject({
      core: join(root, "core"),
      checkout: join(root, "product"),
      product: "billing",
      out: join(root, "out"),
      steps: ["gen", "typecheck"],
      dryRun: false,
      today: "2026-11-01",
    });
    expect(Object.keys(options?.matrix ?? {})).toEqual(["billing"]);
    expect(options?.reproduce).toBe(
      `stackra consumer-gate --core ${join(root, "core")} --checkout ${join(root, "product")} --product billing --out ${join(root, "out")} --matrix ${join(root, "tools/consumer-gate/matrix.yaml")} --allow ${join(root, "tools/consumer-gate/allow.yaml")} --steps gen,typecheck --today 2026-11-01`,
    );
  });

  it("returns the summary as the --json data and prints a setup error", async () => {
    vi.mocked(runConsumerGate).mockReturnValue({ code: 0, summary: SUMMARY });
    const json = await gate([...REQUIRED, "--dry-run", "--json"]);
    expect(json.exitCode).toBe(0);
    expect((json.json as { data: unknown }).data).toEqual(SUMMARY);
    expect(vi.mocked(runConsumerGate).mock.calls[0]?.[0].dryRun).toBe(true);

    vi.mocked(runConsumerGate).mockReturnValue({ code: 2, error: "core is not built" });
    const failed = await gate(REQUIRED);
    expect(failed.exitCode).toBe(2);
    expect(failed.stderr).toContain("core is not built");
  });

  it("refuses a bad command line with 2 before the gate runs", async () => {
    for (const args of [
      REQUIRED.slice(2),
      [...REQUIRED, "--today", "1 Nov"],
      [...REQUIRED, "--mode", "copy"],
      [...REQUIRED, "--steps", "deploy"],
      [...REQUIRED, "--matrix", "missing.yaml"],
    ]) {
      expect((await gate(args)).exitCode).toBe(2);
    }
    expect(runConsumerGate).not.toHaveBeenCalled();
  });
});
