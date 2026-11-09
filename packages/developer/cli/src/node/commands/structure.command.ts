/**
 * Stackra file contract:
 * Purpose: `StructureCommand`, `stackra structure [--write-docs]`: prints the generated repository structure standards
 *          page byte-exact (so it can be redirected; under `--json` it is `{ page }`), or with `--write-docs` writes it
 *          to apps/docs/src/docs/standards/structure.mdx (`{ path }` under `--json`) (was `tools/scripts/structure.mjs`).
 *          The structure checks themselves are the `structure` phase of `stackra check`.
 * Boundary: writes only the standards page, and only with `--write-docs`.
 * Runtime: node
 * Governing contract: ADR 0294; ADR 0269; ADR 0022; ADR 0282 (decision 3); ADR 0506; STA-1966.
 */
import { join } from "node:path";

import { Command, Option, type CommandIo } from "@stackra/console";

import { workspaceRoot } from "#node/functions/workspace-root.function";
import { renderStructureDoc } from "#node/structure/functions/render-structure-doc.function";
import { writeStructureDoc } from "#node/structure/functions/write-structure-doc.function";

/** Prints or writes the repository structure standards page. */
export class StructureCommand extends Command({
  name: "structure",
  description: "Print the repository structure standards page, or --write-docs to write it",
  bin: true,
}) {
  /** Write the page into the docs app instead of printing it. */
  @Option({ description: "Write the page to apps/docs/src/docs/standards/structure.mdx" })
  writeDocs = false;

  /** Prints the page, or writes it and says where. */
  async handle(
    io: CommandIo,
  ): Promise<{ readonly page: string } | { readonly path: string } | undefined> {
    if (this.writeDocs) {
      const path = writeStructureDoc(
        join(workspaceRoot(io.cwd), "apps/docs/src/docs/standards/structure.mdx"),
      );
      io.output.success(`wrote ${path}`);
      return { path };
    }
    const page = renderStructureDoc();
    if (io.json) return { page };
    // The page is a document, not console lines: written unindented so `stackra structure > page.mdx` stays exact.
    io.stdout.write(`${page}\n`);
    return undefined;
  }
}
