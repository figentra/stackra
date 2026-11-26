/**
 * Stackra file contract:
 * Purpose: unit tests of `ContractCommand` on the console: it compares with the merge base of HEAD and `--base`
 *          (`origin/main` by default), passes `--oasdiff` and `--today` through, draws each finding as a failed row
 *          and exits 1, emits the findings under `--json`, prints the clean line and exits 0 with none, and refuses a
 *          bad `--today` or a base with no merge base as usage errors.
 * Boundary: test only; `contractFindings` is replaced, and a throwaway git repository gives the merge base.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0182 (decision 4); ADR 0506; STA-2837.
 */
import { execFileSync } from "node:child_process";

import { runCommandForTest } from "@stackra/console/testing";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { ContractCommand } from "#node/commands/contract.command";
import {
  contractWorkspace,
  type ContractWorkspace,
} from "#node/contract/__tests__/fixtures/contract-workspace.fixture";
import { contractFindings } from "#node/contract/functions/contract-findings.function";

vi.mock("#node/contract/functions/contract-findings.function", () => ({
  contractFindings: vi.fn(),
}));

const finding = {
  dir: "services/billing",
  text: "POST /app/invoices/{id}/void: API path removed without deprecation [api-path-removed-without-deprecation]",
};

let workspace: ContractWorkspace;
let first: string;
let second: string;

beforeEach(() => {
  vi.mocked(contractFindings).mockReset();
  workspace = contractWorkspace();
  first = workspace.commit("first");
  workspace.write("README.md", "change\n");
  second = workspace.commit("second");
  // origin/main is the first commit, as a fetched remote branch would be.
  execFileSync("git", ["update-ref", "refs/remotes/origin/main", first], { cwd: workspace.root });
});

afterEach(() => {
  workspace.dispose();
});

describe("ContractCommand", () => {
  it("compares with the merge base of HEAD and origin/main by default and fails on a finding", async () => {
    vi.mocked(contractFindings).mockResolvedValue([finding]);
    const result = await runCommandForTest(
      [ContractCommand],
      ["contract", "--today", "2026-11-26"],
      {
        cwd: workspace.root,
      },
    );
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("services/billing");
    expect(result.stdout).toContain("API path removed without deprecation");
    expect(contractFindings).toHaveBeenCalledWith(workspace.root, first, { today: "2026-11-26" });
  });

  it("takes --base and --oasdiff, and emits the findings under --json", async () => {
    vi.mocked(contractFindings).mockResolvedValue([finding]);
    const result = await runCommandForTest(
      [ContractCommand],
      [
        "contract",
        "--base",
        "HEAD",
        "--oasdiff",
        "/opt/oasdiff",
        "--today",
        "2026-11-26",
        "--json",
      ],
      { cwd: workspace.root },
    );
    expect(result.exitCode).toBe(1);
    expect(result.json).toEqual({ ok: false, data: [finding] });
    expect(contractFindings).toHaveBeenCalledWith(workspace.root, second, {
      today: "2026-11-26",
      oasdiff: "/opt/oasdiff",
    });
  });

  it("exits 0 with the clean line naming the base", async () => {
    vi.mocked(contractFindings).mockResolvedValue([]);
    const result = await runCommandForTest([ContractCommand], ["contract", "--base", "HEAD~1"], {
      cwd: workspace.root,
    });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(
      `no breaking change to any member's HTTP contract since HEAD~1 (${first.slice(0, 10)})`,
    );
  });

  it("refuses a bad --today and a base with no merge base as usage errors", async () => {
    const today = await runCommandForTest([ContractCommand], ["contract", "--today", "soon"], {
      cwd: workspace.root,
    });
    expect(today.exitCode).toBe(2);
    expect(today.stderr).toContain("--today must be YYYY-MM-DD");
    const base = await runCommandForTest([ContractCommand], ["contract", "--base", "origin/none"], {
      cwd: workspace.root,
    });
    expect(base.exitCode).toBe(2);
    expect(base.stderr).toContain("no merge base of HEAD and origin/none");
    expect(contractFindings).not.toHaveBeenCalled();
  });
});
