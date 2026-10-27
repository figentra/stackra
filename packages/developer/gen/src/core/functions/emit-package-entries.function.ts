/**
 * Stackra file contract:
 * Purpose: `emitPackageEntries`, a package's entry barrels (`.stackra/entry/{index,contracts,node,react,native,
 *          testing}.ts`, which package.json `exports` point at): named re-exports of every export of the entry's
 *          folders, plus the shipped `X$` of the shapes, enums, configs, actions and queries declared there, and the
 *          generated `<Key>Module` in `node` when the package authors none, and in `node` each module's entity
 *          schemas (`<MODULE>_ENTITIES`) for the host to register.
 * Boundary: pure. `.` holds `src/config` and `src/core`; `node` holds `src/node` except `database/factories` and
 *           `database/seeders`, which `testing` holds with `src/testing`, so a server never loads a factory. An entry
 *           with nothing to export is not written. No symbol is exported from two entries.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15: entry folders; the barrels are generated); ADR 0295 (decision 7); ADR
 *                     0305 (rules 16 and 18); ADR 0127 2026-10-24 note (the allowed entries); ADR 0336 (a module of
 *                     model additions re-exports its side-table entities).
 */
import { entitiesName } from "#core/functions/entities-name.function";
import { entryOf } from "#core/functions/entry-of.function";
import { generatedHeader } from "#core/functions/generated-header.function";
import { rootModuleOf } from "#core/functions/root-module-of.function";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** The package entries in the order they are written, with the runtime each runs on. */
const ENTRIES = [
  ["index", "isomorphic"],
  ["contracts", "isomorphic"],
  ["node", "node"],
  ["react", "isomorphic"],
  ["native", "isomorphic"],
  ["testing", "isomorphic"],
] as const;

/** One `export { ... } from` line. */
function exportLine(
  names: readonly { readonly name: string; readonly typeOnly: boolean }[],
  from: string,
): string {
  const sorted = [...names].sort((left, right) => left.name.localeCompare(right.name));
  if (sorted.every((entry) => entry.typeOnly))
    return `export type { ${sorted.map((entry) => entry.name).join(", ")} } from "${from}";`;
  return `export { ${sorted.map((entry) => (entry.typeOnly ? `type ${entry.name}` : entry.name)).join(", ")} } from "${from}";`;
}

/**
 * The entry barrels of a package.
 *
 * @param ir - the package read by discovery.
 * @returns one file per entry that has an export; empty for a member that is not a package.
 * @example
 * emitPackageEntries(ir).map((file) => file.path); // [".stackra/entry/index.ts", ".stackra/entry/node.ts", ...]
 */
export function emitPackageEntries(ir: MemberIR): GeneratedFile[] {
  if (ir.layout !== "package") return [];
  const lines = new Map<string, string[]>(ENTRIES.map(([entry]) => [entry, []]));
  const schemaNames = new Map<string, Map<string, string[]>>();
  const addSchema = (file: string, module: string, name: string): void => {
    const entry = entryOf(file);
    if (entry === undefined) return;
    const byModule = schemaNames.get(entry) ?? new Map<string, string[]>();
    byModule.set(module, [...(byModule.get(module) ?? []), `${name}$`]);
    schemaNames.set(entry, byModule);
  };

  for (const file of [...ir.files].sort((left, right) =>
    left.importPath < right.importPath ? -1 : 1,
  )) {
    const entry = entryOf(file.file);
    if (entry === undefined || file.names.length === 0 || /\/index\.tsx?$/.test(file.file))
      continue;
    lines.get(entry)?.push(exportLine(file.names, file.importPath));
  }
  for (const shape of ir.shapes) addSchema(shape.file, shape.module, shape.name);
  for (const declaration of ir.enums)
    addSchema(declaration.file, declaration.module, declaration.name);
  for (const declared of ir.classes)
    if (
      declared.kind === "action" ||
      declared.kind === "query" ||
      (declared.kind === "config" && declared.options["schema"] !== undefined)
    )
      addSchema(declared.file, declared.module, declared.name);
  for (const [entry, byModule] of schemaNames)
    for (const [module, names] of [...byModule].sort(([left], [right]) =>
      left.localeCompare(right),
    ))
      lines.get(entry)?.push(
        exportLine(
          [...new Set(names)].map((name) => ({ name, typeOnly: false })),
          `#stackra/schemas/${module}`,
        ),
      );
  const root = rootModuleOf(ir);
  if (root?.generated === true)
    lines.get("node")?.push(exportLine([{ name: root.name, typeOnly: false }], root.from));
  // A host registers a package's entity schemas from here (`registerEntities([...SCOPE_ENTITIES])`).
  for (const module of [
    ...new Set(
      ir.shapes
        .filter((shape) => shape.kind === "model" || shape.kind === "model_addition")
        .map((shape) => shape.module),
    ),
  ].sort())
    lines
      .get("node")
      ?.push(
        exportLine(
          [{ name: entitiesName(module), typeOnly: false }],
          `#stackra/entities/${module}`,
        ),
      );

  const files: GeneratedFile[] = [];
  for (const [entry, runtime] of ENTRIES) {
    const body = lines.get(entry) ?? [];
    if (body.length === 0) continue;
    const subpath = entry === "index" ? "." : `./${entry}`;
    const header = generatedHeader({
      from:
        entry === "index"
          ? "src/config and src/core"
          : entry === "testing"
            ? "src/testing and src/node/database"
            : `src/${entry}`,
      purpose: `the \`${subpath}\` entry of ${ir.package}: every export of its folders and their shipped schemas.`,
      boundary: `named re-exports only; package.json \`exports["${subpath}"]\` points here. No symbol is exported from two entries.`,
      runtime,
    });
    files.push({ path: `.stackra/entry/${entry}.ts`, content: [header, ...body, ""].join("\n") });
  }
  return files;
}
