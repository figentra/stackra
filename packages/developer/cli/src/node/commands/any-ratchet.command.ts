/**
 * Stackra file contract:
 * Purpose: `AnyRatchetCommand`, `stackra any-ratchet`: the `any` ratchet of `pnpm validate` on its own. Each package
 *          above its baseline is a failed checklist row (the findings are the `--json` data), a warning names the
 *          baselines that can be lowered, and any finding exits 1 (was `tools/scripts/any-ratchet.mjs`).
 * Boundary: reads the workspace sources and the baseline; writes nothing.
 * Runtime: node
 * Governing contract: rule-gap list N-5 (owner D11, 2026-10-28); STA-1388; ADR 0282 (decision 3); ADR 0506; STA-1966.
 */
import { Command, type CommandIo } from "@stackra/console";

import { BASELINE_FILE } from "#node/any-ratchet/constants/baseline-file.constant";
import { anyRatchetFindings } from "#node/any-ratchet/functions/any-ratchet-findings.function";
import { loweredBaselines } from "#node/any-ratchet/functions/lowered-baselines.function";
import { reportFindings } from "#node/functions/report-findings.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";

/** Fails when a package has more `no-explicit-any` disables than its baseline. */
export class AnyRatchetCommand extends Command({
  name: "any-ratchet",
  description: "Fail when a package has more no-explicit-any disable comments than its baseline",
  bin: true,
}) {
  /** Reports the packages above their baseline, then the baselines that can come down. */
  async handle(io: CommandIo): Promise<number> {
    const root = workspaceRoot(io.cwd);
    const code = reportFindings(
      io,
      anyRatchetFindings(root),
      "no package is above its any baseline",
    );
    const lowered = loweredBaselines(root);
    if (lowered.length > 0)
      io.output.warn(`lower these in ${BASELINE_FILE}: ${lowered.join(", ")}`);
    return code;
  }
}
