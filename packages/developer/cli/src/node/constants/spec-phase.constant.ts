/**
 * Stackra file contract:
 * Purpose: `SPEC_PHASE`, phase 11 of `stackra check`: the read-only spec checks (`specFindings`) of a repository that keeps
 *          spec-kit specs in `.agents/specs`: the stage gate of every spec folder changed since the base (`--base`, else
 *          `origin/main`), the foreign-status, bug-lane and lane gates, and the trace rules. A repository without
 *          `.agents/specs` reports "skipped (no specs)".
 * Boundary: the checks are published code in `@stackra/repo-checks`, so the phase runs in any repository; it reads
 *           files and runs `git` through the functions it hands the checks. The `STACKRA_BRANCH` and
 *           `SPEC_GATE_REQUIRE_READY=1` environment variables are read here, as the repository's scripts read them.
 *           Only the Linear side effects of core's spec workflow stay in core's `tools/scripts`.
 * Runtime: node
 * Governing contract: ADR 0198 (spec states and traceability); ADR 0282 (decisions 3 and 4, as amended).
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { SPECS_DIR, specFindings } from "@stackra/repo-checks/node";

import type { CheckPhase } from "#node/types/check-phase.type";

/** The `spec` phase. */
export const SPEC_PHASE: CheckPhase = {
  name: "spec",
  tool: "spec",
  adr: "0198",
  async run({ root, base }) {
    if (!existsSync(join(root, SPECS_DIR))) return { findings: [], skipped: "no specs" };
    const git = (args: readonly string[]): string | null => {
      try {
        return execFileSync("git", [...args], {
          cwd: root,
          encoding: "utf8",
          maxBuffer: 64 << 20,
          stdio: ["ignore", "pipe", "ignore"],
        });
      } catch {
        return null;
      }
    };
    const branch =
      process.env["STACKRA_BRANCH"] || (git(["branch", "--show-current"]) ?? "").trim();
    const findings = specFindings({
      base: base ?? "origin/main",
      branch,
      requireReady: process.env["SPEC_GATE_REQUIRE_READY"] === "1",
      git,
      exists: (path) => existsSync(join(root, path)),
      read: (path) =>
        existsSync(join(root, path)) ? readFileSync(join(root, path), "utf8") : undefined,
      list: (path) => (existsSync(join(root, path)) ? readdirSync(join(root, path)) : []),
    });
    return {
      findings: findings.map((finding) => ({ ...finding, adr: finding.adr ?? SPEC_PHASE.adr })),
    };
  },
};
