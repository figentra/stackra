/**
 * Stackra file contract:
 * Purpose: `DuplicationCommand`, `stackra duplication [--update]`: the copy-paste ratchet of `pnpm validate`
 *          (rule-gap B-9, stackra-235): runs jscpd per member over its `src/` (tests apart) and fails when a member's
 *          source percentage rises above `BASELINE_PATH`, or above `newMemberCap` with no row; each such member is a
 *          failed checklist row (the findings are the `--json` data) and any exits 1. `--update` rewrites the baseline
 *          from the current tree, keeping its leading comment block (was `tools/scripts/duplication.mjs`).
 * Boundary: writes only the baseline (with `--update`).
 * Runtime: node
 * Governing contract: rule-gap B-9 (notes handover/testing/rule-gap-list.md); ADR 0022 (tests beside the code); ADR 0282
 *                     (decision 3); ADR 0506; STA-1966.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { Command, Option, type CommandIo } from "@stackra/console";
import { parse, stringify } from "yaml";

import { BASELINE_PATH } from "#node/duplication/constants/baseline-path.constant";
import { DEFAULT_SETTINGS } from "#node/duplication/constants/default-settings.constant";
import { baselineDocument } from "#node/duplication/functions/baseline-document.function";
import { measureMembers } from "#node/duplication/functions/measure-members.function";
import { ratchetFindings } from "#node/duplication/functions/ratchet-findings.function";
import type { DuplicationBaseline } from "#node/duplication/types/duplication-baseline.type";
import { reportFindings } from "#node/functions/report-findings.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";

/** Holds each member's `src/` duplication to its baseline. */
export class DuplicationCommand extends Command({
  name: "duplication",
  description:
    "Fail when a member's src/ duplication rises above its baseline; --update rewrites it",
  bin: true,
}) {
  /** Rewrite the baseline from the current tree instead of checking it. */
  @Option({ description: "Rewrite the baseline from the current tree" })
  update = false;

  /** Measures every member, then checks or rewrites the baseline. */
  async handle(io: CommandIo): Promise<number> {
    const root = workspaceRoot(io.cwd);
    const file = join(root, BASELINE_PATH);
    const text = existsSync(file) ? readFileSync(file, "utf8") : "";
    const baseline = (parse(text) ?? {}) as DuplicationBaseline;
    const measured = measureMembers(root, baseline.minTokens ?? DEFAULT_SETTINGS.minTokens);
    if (this.update) {
      // Keeps the file's leading comment block (its contract docblock) above the regenerated data.
      const header = text.match(/^(?:#.*\n)*/)?.[0] ?? "";
      writeFileSync(file, header + stringify(baselineDocument(baseline, measured)));
      io.output.success(`wrote ${BASELINE_PATH}`);
      return 0;
    }
    return reportFindings(
      io,
      ratchetFindings(baseline, measured),
      "no member's duplication is above its baseline",
    );
  }
}
