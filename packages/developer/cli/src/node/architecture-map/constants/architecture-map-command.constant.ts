/**
 * Stackra file contract:
 * Purpose: `ARCHITECTURE_MAP_COMMAND`, `stackra architecture-map [--check]`: writes the archify architecture candidate
 *          (`MAP_SOURCE`) from the workspace and renders it with the vendored archify skill into `MAP_OUTPUT`;
 *          `--check` prints the drift finding and exits 1 instead (was `tools/scripts/architecture-map.mjs`, STA-1373).
 * Boundary: writes only the candidate, a JSON copy and archify's delivery receipt under node_modules/.cache, and
 *           (through archify) the HTML asset.
 * Runtime: node
 * Governing contract: ADR 0003 (tiers); ADR 0452 (system graph); STA-1373; ADR 0282 (decision 3).
 */
import { existsSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { stringify } from "yaml";

import { MAP_COMMAND } from "#node/architecture-map/constants/map-command.constant";
import { MAP_OUTPUT } from "#node/architecture-map/constants/map-output.constant";
import { MAP_SOURCE } from "#node/architecture-map/constants/map-source.constant";
import { architectureMapFindings } from "#node/architecture-map/functions/architecture-map-findings.function";
import { readArchitectureInputs } from "#node/architecture-map/functions/read-architecture-inputs.function";
import { renderArchitectureMap } from "#node/architecture-map/functions/render-architecture-map.function";
import { runProcess } from "#node/functions/run-process.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** The header of the committed candidate. */
const MAP_HEADER = `# Stackra file contract:
# Purpose: the archify architecture candidate of the Stackra architecture map (STA-1373), GENERATED.
# Boundary: never edit it; run \`${MAP_COMMAND}\` and commit it with
#           apps/docs/src/assets/architecture-map.html. pnpm validate fails when it drifts.
# Runtime: none
# Governing contract: ADR 0452; STA-1373.
`;

/** The vendored archify CLI, repository-relative. */
const ARCHIFY = ".agents/skills/archify/bin/archify.mjs";

/** The `stackra architecture-map` command. */
export const ARCHITECTURE_MAP_COMMAND: CliCommand = {
  name: "architecture-map",
  summary: "Write the docs architecture map (archify candidate and HTML), or --check it for drift",
  usage: "stackra architecture-map [--check]",
  options: { check: { type: "boolean" } },
  async run({ cwd, values, io }) {
    const root = workspaceRoot(cwd);
    if (values["check"] === true) {
      const findings = architectureMapFindings(root);
      for (const { dir, text } of findings) io.err(`${dir}: ${text}\n`);
      return findings.length > 0 ? 1 : 0;
    }
    const map = renderArchitectureMap(readArchitectureInputs(root));
    writeFileSync(join(root, MAP_SOURCE), `${MAP_HEADER}${stringify(map, { lineWidth: 0 })}`);
    const outDir = join(root, "node_modules", ".cache", "archify-architecture-map");
    mkdirSync(outDir, { recursive: true });
    const candidate = join(outDir, "architecture-map.json");
    writeFileSync(candidate, `${JSON.stringify(map, null, 2)}\n`);
    const status = await runProcess(
      {
        command: process.execPath,
        args: [
          ARCHIFY,
          "finalize",
          "architecture",
          candidate,
          MAP_OUTPUT,
          "--quality",
          "standard",
          "--out-dir",
          outDir,
          "--json",
        ],
        cwd: root,
      },
      io,
    );
    // archify writes its delivery receipt (absolute paths, a random id) beside the HTML; keep it out of the served assets.
    const receipt = join(root, MAP_OUTPUT.replace(/\.html$/, ".delivery.json"));
    if (existsSync(receipt)) renameSync(receipt, join(outDir, "architecture-map.delivery.json"));
    return status;
  },
};
