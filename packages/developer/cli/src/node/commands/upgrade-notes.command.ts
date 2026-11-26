/**
 * Stackra file contract:
 * Purpose: `UpgradeNotesCommand`, `stackra upgrade-notes`: the release gate of `stackra upgrade` (ADR 0199
 *          Enforcement). It fails (exit 1) when a pending `@stackra/*` changeset or a released `@stackra/*` changelog
 *          entry carries a break mark and has no `UPGRADE_CODEMODS` entry, or names an entry that does not exist;
 *          `pnpm validate` runs it, so the pull request that adds the changeset and the version pull request are
 *          both held. The findings, as `{ dir: "", text }`, are the `--json` data.
 * Boundary: reads the checkout; writes nothing. A repository with no `@stackra/*` changesets or changelogs passes.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2 and Enforcement); ADR 0013 (decision 5); ADR 0282 (decision 3); STA-145.
 */
import { Command, type CommandIo } from "@stackra/console";

import { reportFindings } from "#node/functions/report-findings.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";
import { UPGRADE_CODEMODS } from "#node/upgrade/constants/upgrade-codemods.constant";
import { checkUpgradeNotes } from "#node/upgrade/functions/check-upgrade-notes.function";
import { readReleaseNotes } from "#node/upgrade/functions/read-release-notes.function";

/** Fails when a breaking `@stackra/*` release note has no `stackra upgrade` entry. */
export class UpgradeNotesCommand extends Command({
  name: "upgrade-notes",
  description:
    "Fail when a breaking @stackra/* changeset or changelog entry has no stackra upgrade entry",
  bin: true,
}) {
  /** Reports the uncovered notes. */
  async handle(io: CommandIo): Promise<number> {
    const findings = checkUpgradeNotes(
      readReleaseNotes(workspaceRoot(io.cwd)),
      UPGRADE_CODEMODS,
    ).map((text) => ({ dir: "", text }));
    return reportFindings(
      io,
      findings,
      "every breaking @stackra/* release note has a stackra upgrade entry",
    );
  }
}
