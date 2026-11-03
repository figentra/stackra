/**
 * Stackra file contract:
 * Purpose: `VALIDATE_COMMAND`, `stackra validate`: the check phases a product calls `validate` (config, structure, docs,
 *          catalogues, spec), and with `--repository` the repository-shape gate `pnpm validate` runs (was
 *          `tools/scripts/validate-repository.mjs`): the config, catalogue and structure checks of @stackra/repo-checks,
 *          the package cycles, the Expo native dependencies, the duplicate exports, the `any` ratchet and the
 *          architecture map drift, the Python placement (ADR 0492 decision 7), the package entity lists (STA-1793), the lang
 *          catalogue exports (STA-1798), the launch files' drift from the runways (STA-2081) and the
 *          session settings (ADR 0495 decision 3, STA-1699). `--repository` prints the findings as `<dir>: <finding>` and a count and exits 1,
 *          or prints nothing.
 * Boundary: reads the checkout and runs `pnpm -r list`; notices (an unbuilt runway package) go to `io.err`.
 * Runtime: node
 * Governing contract: ADR 0129; ADR 0492 (decision 7); ADR 0495 (decision 3); ADR 0022; ADR 0282 (decision 3); STA-1373; STA-1544; stackra-224; stackra-229.
 */
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
import type { CliCommand } from "#node/types/cli-command.type";

/** The check phases `validate` runs without `--repository`. */
const CHECK = checkCommand(
  "validate",
  "Check the repository's shape (config, structure, docs, catalogues, spec); --repository runs the repo gate",
  { only: ["config", "structure", "docs", "catalogues", "spec"] },
);

/** The `stackra validate` command. */
export const VALIDATE_COMMAND: CliCommand = {
  ...CHECK,
  usage: `${CHECK.usage} [--repository]`,
  options: { ...CHECK.options, repository: { type: "boolean" } },
  async run(context) {
    if (context.values["repository"] !== true) return CHECK.run(context);
    const { cwd, io } = context;
    const root = workspaceRoot(cwd);
    const repo = readRepoContext(root);
    const findings = [
      ...configFindings(repo),
      ...catalogueFindings(repo),
      ...(await structureFindings(repo, {
        ci: Boolean(process.env["CI"]),
        warn: (text) => io.err(`${text}\n`),
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
    for (const { dir, text } of findings) io.err(`${dir || "."}: ${text}\n`);
    if (findings.length > 0) {
      io.err(`\n${findings.length} finding(s).\n`);
      return 1;
    }
    return 0;
  },
};
