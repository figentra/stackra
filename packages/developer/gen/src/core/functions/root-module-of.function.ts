/**
 * Stackra file contract:
 * Purpose: `rootModuleOf`, the member's root module: the authored `<key>.module.ts` class when the member writes one,
 *          or the generated `<Key>Module` of `#stackra/module` otherwise. A package without a class the container
 *          builds (no binding, driver or config) ships no module at all.
 * Boundary: pure. The same answer feeds the manifest's module entry, the wiring's `root`, the member module file, the
 *           package `node` entry and the runtime entries, so they never disagree.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 15 and 16: the module is optional; a generated `<Key>Module`); ADR 0295
 *                     (decision 7: the entry passes the root module).
 */
import { BINDING_KINDS } from "#core/constants/binding-kinds.constant";
import { pascalCase } from "#core/functions/pascal-case.function";
import type { ClassRef } from "#core/types/class-ref.type";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The root module of `ir`, and whether gen writes it.
 *
 * @example
 * rootModuleOf(ir); // { name: "CommerceModule", from: "#stackra/module", generated: true }
 */
export function rootModuleOf(
  ir: MemberIR,
): (ClassRef & { readonly generated: boolean }) | undefined {
  if (ir.rootModule !== undefined) return { ...ir.rootModule, generated: false };
  const builds = ir.classes.some(
    (declared) =>
      BINDING_KINDS.includes(declared.kind) ||
      declared.kind === "driver" ||
      declared.kind === "config",
  );
  if (ir.layout === "package" && !builds) return undefined;
  return { name: `${pascalCase(ir.member)}Module`, from: "#stackra/module", generated: true };
}
