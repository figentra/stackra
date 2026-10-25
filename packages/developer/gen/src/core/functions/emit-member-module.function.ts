/**
 * Stackra file contract:
 * Purpose: `emitMemberModule`, the member's `#stackra/module` (`.stackra/gen/module.ts`) when the member authors no
 *          root module: the `<Key>Module` class, importing every dependency that ships a module (read from its
 *          committed manifest), imported from that dependency's `node` entry, in package.json order.
 * Boundary: pure. Returns undefined when the member authors its root module or ships none. It states nothing gen
 *           cannot derive: no `exports` and no `wrap`; a member that needs either authors `<key>.module.ts`.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 15 and 16: the module is a folder; a generated `<Key>Module`); ADR 0295
 *                     (decision 7: the entry passes the root module).
 */
import { generatedHeader } from "#core/functions/generated-header.function";
import { importLines } from "#core/functions/import-lines.function";
import { rootModuleOf } from "#core/functions/root-module-of.function";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The member module file of `ir`, or undefined when gen writes none.
 *
 * @param ir - the member read by discovery.
 * @example
 * emitMemberModule(ir); // "...export class CommerceModule extends Module({ imports: [LoyaltyKitModule] }) {}\n"
 */
export function emitMemberModule(ir: MemberIR): string | undefined {
  const root = rootModuleOf(ir);
  if (root === undefined || !root.generated) return undefined;
  const imports = new Map<string, Map<string, boolean>>([
    ["@stackra/container", new Map([["Module", false]])],
  ]);
  const modules: string[] = [];
  for (const { package: name, manifest } of ir.dependencies) {
    if (manifest.kind === "app") continue;
    const moduleClass = manifest.modules?.find(
      (candidate) => candidate.key === manifest.member,
    )?.class;
    if (moduleClass === undefined || modules.includes(moduleClass)) continue;
    modules.push(moduleClass);
    imports.set(`${name}/node`, new Map([[moduleClass, false]]));
  }
  const base = modules.length > 0 ? `Module({ imports: [${modules.join(", ")}] })` : "Module";
  const header = generatedHeader({
    from: "package.json and the folders under src/",
    purpose: `\`${root.name}\`, the member module of ${ir.package}, written because the member authors no root module.`,
    boundary:
      `the key is the member key (\`${ir.member}\`); its feature modules are the folders under src/, and its imports ` +
      "are the dependencies that ship a module. An authored root module replaces this file.",
    runtime: "isomorphic",
  });
  return [
    header,
    ...importLines(imports),
    "",
    `/** The ${ir.member} member${modules.length > 0 ? `, importing ${modules.join(", ")}` : ""}. */`,
    `export class ${root.name} extends ${base} {}`,
    "",
  ].join("\n");
}
