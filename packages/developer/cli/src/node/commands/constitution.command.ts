/**
 * Stackra file contract:
 * Purpose: `ConstitutionCommand`, `stackra constitution [--check]`: writes `.flow/constitution.md`, the file Figentra
 *          Flow's `flow-*` commands read, from the docs laws; `--check` instead reports drift as a failed checklist row
 *          and exits 1 (was part of `tools/scripts/agents-sync.mjs`, STA-2098 H6).
 * Boundary: writes only `.flow/constitution.md`; a workspace without laws writes nothing.
 * Runtime: node
 * Governing contract: ADR 0510; STA-2098 (H6).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { Command, Option, type CommandIo } from "@stackra/console";

import {
  CONSTITUTION_PATHS,
  constitutionFindings,
  expectedConstitution,
  readRepoContext,
} from "@stackra/repo-checks/node";
import { reportFindings } from "#node/functions/report-findings.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";

/** Writes `.flow/constitution.md`, or checks it for drift. */
export class ConstitutionCommand extends Command({
  name: "constitution",
  description: "Write .flow/constitution.md from the docs laws, or --check it for drift",
  bin: true,
}) {
  /** Report drift instead of writing. */
  @Option({ description: "Fail when .flow/constitution.md drifted, instead of writing it" })
  check = false;

  /** Checks the rendered constitution, or writes it. */
  async handle(io: CommandIo): Promise<number> {
    const root = workspaceRoot(io.cwd);
    if (this.check)
      return reportFindings(
        io,
        constitutionFindings(readRepoContext(root)),
        "the constitution is current",
      );
    const text = expectedConstitution(root);
    if (text === undefined) {
      io.output.success(`no ${CONSTITUTION_PATHS.source}: nothing to write`);
      return 0;
    }
    const path = join(root, CONSTITUTION_PATHS.output);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
    io.output.success(`wrote ${CONSTITUTION_PATHS.output}`);
    return 0;
  }
}
