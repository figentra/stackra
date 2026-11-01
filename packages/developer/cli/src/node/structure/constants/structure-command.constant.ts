/**
 * Stackra file contract:
 * Purpose: `STRUCTURE_COMMAND`, `stackra structure [--write-docs]`: prints the generated repository structure standards
 *          page, or with `--write-docs` writes it to apps/docs/src/docs/standards/structure.mdx (was
 *          `tools/scripts/structure.mjs`). The structure checks themselves are the `structure` phase of `stackra check`.
 * Boundary: writes only the standards page, and only with `--write-docs`.
 * Runtime: node
 * Governing contract: ADR 0294; ADR 0269; ADR 0022; ADR 0282 (decision 3).
 */
import { join } from "node:path";

import { workspaceRoot } from "#node/functions/workspace-root.function";
import { renderStructureDoc } from "#node/structure/functions/render-structure-doc.function";
import { writeStructureDoc } from "#node/structure/functions/write-structure-doc.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** The `stackra structure` command. */
export const STRUCTURE_COMMAND: CliCommand = {
  name: "structure",
  summary: "Print the repository structure standards page, or --write-docs to write it",
  usage: "stackra structure [--write-docs]",
  options: { "write-docs": { type: "boolean" } },
  async run({ cwd, values, io }) {
    if (values["write-docs"] === true) {
      const path = join(workspaceRoot(cwd), "apps/docs/src/docs/standards/structure.mdx");
      io.out(`wrote ${writeStructureDoc(path)}\n`);
    } else io.out(`${renderStructureDoc()}\n`);
    return 0;
  },
};
