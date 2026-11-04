/**
 * Stackra file contract:
 * Purpose: `ValidateCommand`, `stackra validate`: the check phases a product calls `validate` (config, structure, docs,
 *          catalogues, spec) with the check flags, and with `--repository` the repository-shape gate `pnpm validate`
 *          runs (was `tools/scripts/validate-repository.mjs`): the config, catalogue and structure checks of
 *          @stackra/repo-checks, the package cycles, the Expo native dependencies, the duplicate exports, the `any`
 *          ratchet and the architecture map drift, the Python placement (ADR 0492 decision 7), the package entity lists
 *          (STA-1793), the lang catalogue exports (STA-1798), the launch files' drift from the runways (STA-2081) and
 *          the session settings (ADR 0495 decision 3, STA-1699). `--repository` prints the findings as
 *          `<dir>: <finding>` and a count on standard error and exits 1, or prints nothing; its `--json` data is the
 *          findings. A tool of the local developer MCP (ADR 0282 decision 5).
 * Boundary: reads the checkout and runs `pnpm -r list`; notices (an unbuilt runway package) go to standard error. Not
 *           read-only as a tool: `--fix` writes.
 * Runtime: node
 * Governing contract: ADR 0129; ADR 0492 (decision 7); ADR 0495 (decision 3); ADR 0022; ADR 0282 (decisions 3 and 5);
 *                     ADR 0506; STA-1373; STA-1544; STA-1966; stackra-224; stackra-229.
 */
import { Option, type CommandIo } from "@stackra/console";
import {
  catalogueFindings,
  configFindings,
  readRepoContext,
  structureFindings,
} from "@stackra/repo-checks/node";

import { anyRatchetFindings } from "#node/any-ratchet/functions/any-ratchet-findings.function";
import { appNativeDependencyFindings } from "#node/app-native-deps/functions/app-native-dependency-findings.function";
import { architectureMapFindings } from "#node/architecture-map/functions/architecture-map-findings.function";
import { packageCycleFindings } from "#node/cycles/functions/package-cycle-findings.function";
import { duplicateExportFindings } from "#node/duplicate-exports/functions/duplicate-export-findings.function";
import { checkCommand } from "#node/functions/check-command.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";
import { launchConfigFindings } from "#node/launch-config/functions/launch-config-findings.function";
import { langAssetsFindings } from "#node/lang-assets/functions/lang-assets-findings.function";
import { packageEntitiesFindings } from "#node/package-entities/functions/package-entities-findings.function";
import { pythonPlacementFindings } from "#node/python-placement/functions/python-placement-findings.function";
import { sessionSettingFindings } from "#node/session-settings/functions/session-setting-findings.function";

/** Checks the repository's shape. */
export class ValidateCommand extends checkCommand(
  {
    name: "validate",
    description:
      "Check the repository's shape (config, structure, docs, catalogues, spec); --repository runs the repo gate",
    tool: { readOnly: false },
  },
  { only: ["config", "structure", "docs", "catalogues", "spec"] },
) {
  /** Run the repository gate instead of the check phases. */
  @Option({ description: "Run the repository-shape gate `pnpm validate` runs" })
  repository = false;

  /** Runs the phases, or with `--repository` the gate, and returns 1 on a finding. */
  override async handle(io: CommandIo): Promise<number> {
    if (!this.repository) return super.handle(io);
    const root = workspaceRoot(io.cwd);
    const repo = readRepoContext(root);
    const findings = [
      ...configFindings(repo),
      ...catalogueFindings(repo),
      ...(await structureFindings(repo, {
        ci: Boolean(process.env["CI"]),
        warn: (text) => io.stderr.write(`${text}\n`),
      })),
      ...packageCycleFindings(root),
      ...appNativeDependencyFindings(root),
      ...duplicateExportFindings(root),
      ...anyRatchetFindings(root),
      ...architectureMapFindings(root),
      ...pythonPlacementFindings(root),
      ...packageEntitiesFindings(root),
      ...langAssetsFindings(root),
      ...launchConfigFindings(root),
      ...sessionSettingFindings(root),
    ];
    if (io.json) io.output.json({ findings });
    for (const { dir, text } of findings) io.stderr.write(`${dir || "."}: ${text}\n`);
    if (findings.length > 0) {
      io.stderr.write(`\n${findings.length} finding(s).\n`);
      return 1;
    }
    return 0;
  }
}
