/**
 * Stackra file contract:
 * Purpose: `sourceModules(root)`, the module specifiers a parsed source file imports or re-exports from, found with
 *          ast-grep: a codemod reads a file further only when it names one of its modules.
 * Boundary: pure over the ast-grep tree it is given.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2: ast-grep); STA-145.
 */
import type { SgNode } from "@ast-grep/napi";

/**
 * The modules a file imports or re-exports from.
 *
 * @example
 * sourceModules(parse(Lang.TypeScript, 'import { a } from "x"; export * from "y";').root()); // Set {"x", "y"}
 */
export function sourceModules(root: SgNode): ReadonlySet<string> {
  const modules = new Set<string>();
  for (const statement of root.findAll({
    rule: { any: [{ kind: "import_statement" }, { kind: "export_statement" }] },
  })) {
    const source = statement.field("source");
    if (source !== null) modules.add(source.text().slice(1, -1));
  }
  return modules;
}
