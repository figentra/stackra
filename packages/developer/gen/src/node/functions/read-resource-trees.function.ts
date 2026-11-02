/**
 * Stackra file contract:
 * Purpose: `readResourceTrees(root, ir, loader)`, the tree each resource class of the member records: it writes one
 *          module under `.stackra/cache/` that imports `describeResource` from the member's own `@stackra/panel` and
 *          describes each resource file as it evaluates (top-level await), loads it once through `loader`, and returns the trees by source file, every class in
 *          them written as `{ $class }` (ADR 0307 rule 5).
 * Boundary: runs the resource members once, never a constructor. A member with no resource needs no loader and gets
 *           nothing; one with a resource and no loader is refused (`resource_loader_missing`), so a manifest never
 *           depends on who ran gen. A file that fails to import is `resource_unloadable`; a builder member that throws
 *           is `builder_impure`. The cache module is rewritten each run and read by nothing else.
 * Runtime: node
 * Governing contract: ADR 0307 (rules 5 and 7); ADR 0164 (decision 2); ADR 0111 (decision 3); STA-1947.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import type { Json } from "@stackra/contracts";

import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { ModuleLoader } from "#node/types/module-loader.type";

/** What the cache module reports for one file. */
type Described =
  | { readonly tree: Json }
  | { readonly unloadable: string }
  | { readonly impure: string };

/** The cache module's source: one import thunk per resource file, each described on its own so a failure names it. */
function cacheModule(resources: readonly { file: string; name: string }[]): string {
  return [
    "// Written by stackra gen (STA-1947): describes each resource class once. Rewritten every run.",
    'import { describeResource } from "@stackra/panel";',
    "",
    "const RESOURCES = [",
    ...resources.map(
      ({ file, name }) =>
        `  [${JSON.stringify(file)}, ${JSON.stringify(name)}, () => import(${JSON.stringify(`../../${file}`)})],`,
    ),
    "];",
    "",
    "const message = (error) => (error instanceof Error ? error.message : String(error));",
    "",
    "// Described while the module evaluates: the runner that loads it closes once it has, so no import may come later.",
    "export const described = {};",
    "{",
    "  const out = described;",
    "  for (const [file, name, load] of RESOURCES) {",
    "    let type;",
    "    try {",
    "      type = (await load())[name];",
    "    } catch (error) {",
    "      out[file] = { unloadable: message(error) };",
    "      continue;",
    "    }",
    "    try {",
    "      const tree = describeResource(type);",
    '      out[file] = { tree: JSON.parse(JSON.stringify(tree, (_key, value) => (typeof value === "function" ? { $class: value.name } : value))) };',
    "    } catch (error) {",
    "      out[file] = { impure: message(error) };",
    "    }",
    "  }",
    "}",
    "",
  ].join("\n");
}

/** A refusal about one resource class. */
const refuse = (
  code: string,
  file: string,
  subject: string,
  message: string,
  fix: string,
): GenError => ({ code, file, line: 0, column: 0, subject, message, fix });

/**
 * The resource trees of the member at `root`, or the refusals that stop them.
 *
 * @param root - the member root.
 * @param ir - the member read by discovery.
 * @param loader - imports a module through the member's toolchain; `stackra gen` passes one.
 * @example
 * const { trees } = await readResourceTrees("packages/commerce/loyalty-kit", ir, loader);
 * trees?.["src/node/resources/loyalty-account/loyalty-account.resource.ts"]; // { options: {...}, table: {...}, ... }
 */
export async function readResourceTrees(
  root: string,
  ir: MemberIR,
  loader: ModuleLoader | undefined,
): Promise<{ readonly trees?: Readonly<Record<string, Json>>; readonly errors: GenError[] }> {
  const resources = ir.classes.filter(
    (declared) => declared.kind === "resource" && declared.abstract !== true,
  );
  if (resources.length === 0) return { errors: [] };
  if (loader === undefined)
    return {
      errors: resources.map((declared) =>
        refuse(
          "resource_loader_missing",
          declared.file,
          declared.name,
          `${declared.name} is a resource, and recording its tree needs a module loader, which this gen run was not given`,
          "run `stackra gen` (or `stackra gen --check`), which loads resources through Vite; a caller of `generate` passes `loader`",
        ),
      ),
    };
  const dir = join(root, ".stackra", "cache");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, "resource-trees.ts");
  writeFileSync(file, cacheModule(resources));
  const { described } = (await loader(resolve(file), resolve(root))) as {
    readonly described: Record<string, Described>;
  };
  const trees: Record<string, Json> = {};
  const errors: GenError[] = [];
  for (const declared of resources) {
    const result = described[declared.file];
    if (result !== undefined && "tree" in result) trees[declared.file] = result.tree;
    else if (result !== undefined && "impure" in result)
      errors.push(
        refuse(
          "builder_impure",
          declared.file,
          declared.name,
          `a builder member of ${declared.name} threw when gen ran it on a fresh builder: ${result.impure}`,
          "make `table`, `views`, `form`, `infolist`, `relations` and `actions` read only their argument, never `this` or a dependency",
        ),
      );
    else
      errors.push(
        refuse(
          "resource_unloadable",
          declared.file,
          declared.name,
          `${declared.file} could not be imported to record ${declared.name}: ${result !== undefined && "unloadable" in result ? result.unloadable : "the loader returned nothing for it"}`,
          "fix the import error in the file or in what it imports; a resource file must load without starting anything",
        ),
      );
  }
  return errors.length > 0 ? { errors } : { trees, errors };
}
