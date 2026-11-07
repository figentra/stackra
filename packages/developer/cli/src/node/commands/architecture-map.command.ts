/**
 * Stackra file contract:
 * Purpose: `ArchitectureMapCommand`, `stackra architecture-map [--check]`: writes the archify architecture candidate
 *          (`MAP_SOURCE`) from the workspace and renders it with the vendored archify skill into `MAP_OUTPUT`, exiting
 *          with archify's own code (its output shown when it fails); `--check` instead reports the drift as a failed
 *          checklist row (the findings are the `--json` data) and exits 1 (was `tools/scripts/architecture-map.mjs`,
 *          STA-1373).
 * Boundary: writes only the candidate, a JSON copy and archify's delivery receipt under node_modules/.cache, and
 *           (through archify, run by `io.process`) the HTML asset.
 * Runtime: node
 * Governing contract: ADR 0003 (tiers); ADR 0452 (system graph); STA-1373; ADR 0282 (decision 3); ADR 0506; STA-1966.
 */
import { existsSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { Command, Option, type CommandIo } from "@stackra/console";
import { stringify } from "yaml";

import { MAP_COMMAND } from "#node/architecture-map/constants/map-command.constant";
import { MAP_OUTPUT } from "#node/architecture-map/constants/map-output.constant";
import { MAP_SOURCE } from "#node/architecture-map/constants/map-source.constant";
import { architectureMapFindings } from "#node/architecture-map/functions/architecture-map-findings.function";
import { readArchitectureInputs } from "#node/architecture-map/functions/read-architecture-inputs.function";
import { renderArchitectureMap } from "#node/architecture-map/functions/render-architecture-map.function";
import { reportFindings } from "#node/functions/report-findings.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";

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

/** Writes the docs architecture map, or checks it for drift. */
export class ArchitectureMapCommand extends Command({
  name: "architecture-map",
  description:
    "Write the docs architecture map (archify candidate and HTML), or --check it for drift",
  bin: true,
}) {
  /** Report drift instead of writing. */
  @Option({ description: "Fail when the committed map drifted, instead of writing it" })
  check = false;

  /** Checks the committed map, or writes the candidate and renders it with archify. */
  async handle(io: CommandIo): Promise<number> {
    const root = workspaceRoot(io.cwd);
    if (this.check)
      return reportFindings(io, architectureMapFindings(root), "the architecture map is current");
    const map = renderArchitectureMap(readArchitectureInputs(root));
    writeFileSync(join(root, MAP_SOURCE), `${MAP_HEADER}${stringify(map, { lineWidth: 0 })}`);
    const outDir = join(root, "node_modules", ".cache", "archify-architecture-map");
    mkdirSync(outDir, { recursive: true });
    const candidate = join(outDir, "architecture-map.json");
    writeFileSync(candidate, `${JSON.stringify(map, null, 2)}\n`);
    const { code, output } = await io.process.run(
      process.execPath,
      [
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
      { cwd: root, check: false },
    );
    // archify writes its delivery receipt (absolute paths, a random id) beside the HTML; keep it out of the served assets.
    const receipt = join(root, MAP_OUTPUT.replace(/\.html$/, ".delivery.json"));
    if (existsSync(receipt)) renameSync(receipt, join(outDir, "architecture-map.delivery.json"));
    if (code !== 0) {
      io.output.error(`archify exited ${code}: ${output.trim()}`);
      return code;
    }
    io.output.success(`wrote ${MAP_SOURCE} and ${MAP_OUTPUT}`);
    return 0;
  }
}
