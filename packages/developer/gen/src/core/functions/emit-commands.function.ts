/**
 * Stackra file contract:
 * Purpose: `emitCommands`, the `#stackra/commands` file (`.stackra/gen/commands.ts`): one static import per
 *          `commands` row of the manifest (the member's own from its file, a hosted package's from `<package>/<entry>`)
 *          and `export const COMMANDS`, the classes in manifest order, which the member's console entry hands to
 *          `createConsole` (ADR 0506 decision 6).
 * Boundary: pure; explicit imports only, no discovery at run time. Undefined when the manifest has no `commands` row.
 *           Two classes of one name are told apart by an alias, so the list never shadows one. The file names no
 *           package: the console entry imports `@stackra/console`, this file only the command classes.
 * Runtime: node
 * Governing contract: ADR 0506 (decisions 4 and 6); STA-1731 spec FR-006.
 */
import type { StackraManifest } from "@stackra/contracts";

import { generatedHeader } from "#core/functions/generated-header.function";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The `#stackra/commands` file of `ir`, or undefined when there is nothing to list.
 *
 * @param ir - the member read by discovery.
 * @param manifest - its built manifest.
 * @example
 * emitCommands(ir, manifest); // '... export const COMMANDS = [DbStatusCommand] as const;'
 */
export function emitCommands(ir: MemberIR, manifest: StackraManifest): string | undefined {
  const rows = manifest.commands ?? [];
  if (rows.length === 0) return undefined;
  const used = new Set<string>();
  const imports: string[] = [];
  const names: string[] = [];
  for (const row of rows) {
    const from =
      row.from === undefined
        ? ir.classes.find((declared) => declared.file === row.file && declared.name === row.class)
            ?.importPath
        : row.entry === "index"
          ? row.from
          : `${row.from}/${row.entry}`;
    if (from === undefined) continue;
    let local = row.class;
    for (let at = 2; used.has(local); at += 1) local = `${row.class}${at}`;
    used.add(local);
    imports.push(
      `import { ${local === row.class ? local : `${row.class} as ${local}`} } from "${from}";`,
    );
    names.push(local);
  }
  return [
    generatedHeader({
      from: "the commands of the manifest (`extends Command({ name, description })`) and of the hosted packages",
      purpose: `the console commands of ${ir.package}, own first and then each hosted package's, in manifest order.`,
      boundary:
        "reached as `#stackra/commands`; `.stackra/entry/console.ts` passes `COMMANDS` to `createConsole`. Two commands " +
        "never share a name or alias (`command_collision`).",
      runtime: "node",
    }),
    ...imports,
    "",
    "/** Every command of this member, in manifest order. */",
    `export const COMMANDS = [${names.join(", ")}] as const;`,
    "",
  ].join("\n");
}
