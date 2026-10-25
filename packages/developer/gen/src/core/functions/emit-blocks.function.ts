/**
 * Stackra file contract:
 * Purpose: `emitBlocks`, an app's block registrations per client runtime (`.stackra/gen/blocks/<runtime>.ts`, reached
 *          as `#stackra/blocks/<runtime>`): one `registerBlocks([{ key, block, component }])` call with every block
 *          that runtime can draw, its key derived from the member and the block's folder (`web.testimonials`).
 * Boundary: pure. The component is bound by name beside the block (`testimonials.tsx` on the browser,
 *           `testimonials.native.tsx` on native); a block with no component on a runtime is left out of that
 *           runtime's call. A `@Renamed(old)` key is registerBlocks' to resolve from the class.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 3); ADR 0294 (decisions 20 and 22); ADR 0110 (decision 6).
 */
import { clientRuntimes } from "#core/functions/client-runtimes.function";
import { componentBeside } from "#core/functions/component-beside.function";
import { generatedHeader } from "#core/functions/generated-header.function";
import { importLines } from "#core/functions/import-lines.function";
import { snakeCase } from "#core/functions/snake-case.function";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The block registrations of an app, one file per client runtime that draws a block.
 *
 * @example
 * emitBlocks(appIr)[0]?.path; // ".stackra/gen/blocks/browser.ts"
 */
export function emitBlocks(ir: MemberIR): GeneratedFile[] {
  const blocks = ir.classes.filter((declared) => declared.kind === "block");
  const files: GeneratedFile[] = [];
  for (const runtime of clientRuntimes(ir)) {
    const imports = new Map<string, Map<string, boolean>>([
      ["@stackra/experience", new Map([["registerBlocks", false]])],
    ]);
    const rows: string[] = [];
    for (const block of blocks) {
      const folder = block.file.split("/").slice(-2, -1)[0] ?? "";
      const component = componentBeside(ir, block.file, folder, runtime);
      if (component === undefined) continue;
      for (const target of [{ name: block.name, from: block.importPath }, component])
        imports.set(
          target.from,
          (imports.get(target.from) ?? new Map<string, boolean>()).set(target.name, false),
        );
      rows.push(
        `  { key: ${JSON.stringify(`${ir.member}.${snakeCase(folder)}`)}, block: ${block.name}, component: ${component.name} },`,
      );
    }
    if (rows.length === 0) continue;
    const header = generatedHeader({
      from: "the Block classes under src/blocks and the components beside them",
      purpose: `the ${runtime} blocks of ${ir.package}: each block's key, class and component, registered.`,
      boundary:
        "a block key is `<member>.<folder>` and is locked once a document names it; loading this file registers the " +
        "blocks this runtime can draw.",
      runtime: "isomorphic",
    });
    files.push({
      path: `.stackra/gen/blocks/${runtime}.ts`,
      content: [header, ...importLines(imports), "", "registerBlocks([", ...rows, "]);", ""].join(
        "\n",
      ),
    });
  }
  return files;
}
