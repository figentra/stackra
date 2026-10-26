/**
 * Stackra file contract:
 * Purpose: `SECRETS_PHASE`, phase 4 of `stackra check`: gitleaks over the git history (since `--base` when given), with
 *          the repository's `.gitleaks.toml` when it has one; one finding per leak, redacted.
 * Boundary: starts gitleaks with a JSON report in a temporary folder; skipped when gitleaks is not installed. A secret
 *           value never reaches the output: gitleaks runs with `--redact` and only the rule and location are kept.
 * Runtime: node
 * Governing contract: ADR 0009; ADR 0019 (supply-chain hardening).
 */
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { exitFinding } from "#node/functions/exit-finding.function";
import { runCaptured } from "#node/functions/run-captured.function";
import { toolFinding } from "#node/functions/tool-finding.function";
import type { CheckPhase } from "#node/types/check-phase.type";

/** The fields of one gitleaks JSON report entry the phase keeps. */
type Leak = {
  readonly File?: string;
  readonly StartLine?: number;
  readonly StartColumn?: number;
  readonly RuleID?: string;
  readonly Description?: string;
};

/** The `secrets` phase. */
export const SECRETS_PHASE: CheckPhase = {
  name: "secrets",
  tool: "gitleaks",
  adr: "0009",
  async run({ root, base }) {
    const folder = mkdtempSync(join(tmpdir(), "stackra-check-"));
    const report = join(folder, "gitleaks.json");
    try {
      const output = await runCaptured(
        "gitleaks",
        [
          "git",
          "--no-banner",
          "--redact",
          "--report-format",
          "json",
          "--report-path",
          report,
          ...(existsSync(join(root, ".gitleaks.toml")) ? ["--config", ".gitleaks.toml"] : []),
          ...(base === undefined ? [] : ["--log-opts", `${base}..HEAD`]),
          ".",
        ],
        root,
      );
      if (output === undefined) return { findings: [], skipped: "not installed" };
      const leaks = existsSync(report)
        ? (JSON.parse(readFileSync(report, "utf8") || "[]") as readonly Leak[])
        : [];
      const findings = leaks.map((leak) =>
        toolFinding(SECRETS_PHASE, {
          rule: leak.RuleID ?? "leak",
          path: leak.File ?? ".",
          line: leak.StartLine ?? null,
          column: leak.StartColumn ?? null,
          message: `${leak.Description ?? "possible secret"} (redacted; rotate it, then remove it from history)`,
        }),
      );
      if (output.code !== 0 && findings.length === 0)
        return { findings: [exitFinding(SECRETS_PHASE, output)] };
      return { findings };
    } finally {
      rmSync(folder, { recursive: true, force: true });
    }
  },
};
