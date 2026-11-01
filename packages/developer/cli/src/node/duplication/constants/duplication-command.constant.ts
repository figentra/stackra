/**
 * Stackra file contract:
 * Purpose: `DUPLICATION_COMMAND`, `stackra duplication [--update]`: the copy-paste ratchet of `pnpm validate`
 *          (rule-gap B-9, stackra-235): runs jscpd per member over its `src/` (tests apart) and fails when a member's
 *          source percentage rises above `BASELINE_PATH`, or above `newMemberCap` with no row; `--update` rewrites
 *          the baseline from the current tree, keeping its leading comment block (was `tools/scripts/duplication.mjs`).
 * Boundary: writes only the baseline (with `--update`); prints findings as `<dir>: <finding>`.
 * Runtime: node
 * Governing contract: rule-gap B-9 (notes handover/testing/rule-gap-list.md); ADR 0022 (tests beside the code). ADR 0282 (decision 3).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { parse, stringify } from "yaml";

import { BASELINE_PATH } from "#node/duplication/constants/baseline-path.constant";
import { DEFAULT_SETTINGS } from "#node/duplication/constants/default-settings.constant";
import { baselineDocument } from "#node/duplication/functions/baseline-document.function";
import { measureMembers } from "#node/duplication/functions/measure-members.function";
import { ratchetFindings } from "#node/duplication/functions/ratchet-findings.function";
import type { DuplicationBaseline } from "#node/duplication/types/duplication-baseline.type";
import { workspaceRoot } from "#node/functions/workspace-root.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** The `stackra duplication` command. */
export const DUPLICATION_COMMAND: CliCommand = {
  name: "duplication",
  summary: "Fail when a member's src/ duplication rises above its baseline; --update rewrites it",
  usage: "stackra duplication [--update]",
  options: { update: { type: "boolean" } },
  async run({ cwd, values, io }) {
    const root = workspaceRoot(cwd);
    const file = join(root, BASELINE_PATH);
    const text = existsSync(file) ? readFileSync(file, "utf8") : "";
    const baseline = (parse(text) ?? {}) as DuplicationBaseline;
    const measured = measureMembers(root, baseline.minTokens ?? DEFAULT_SETTINGS.minTokens);
    if (values["update"] === true) {
      // Keeps the file's leading comment block (its contract docblock) above the regenerated data.
      const header = text.match(/^(?:#.*\n)*/)?.[0] ?? "";
      writeFileSync(file, header + stringify(baselineDocument(baseline, measured)));
      return 0;
    }
    const findings = ratchetFindings(baseline, measured);
    for (const { dir, text: finding } of findings) io.err(`${dir}: ${finding}\n`);
    return findings.length > 0 ? 1 : 0;
  },
};
