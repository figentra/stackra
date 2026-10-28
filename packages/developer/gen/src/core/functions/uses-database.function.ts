/**
 * Stackra file contract:
 * Purpose: `usesDatabase`, whether a service has its own logical database: it declares `@stackra/database`, or a
 *          model is its own or a declared package's. `emitBoot` connects it and `emitEncoreDatabase` declares it.
 * Boundary: pure; reads the IR only. One answer for both emitters, so the boot never connects a database Encore does
 *           not provision.
 * Runtime: isomorphic
 * Governing contract: ADR 0238 (decisions 1 to 3: one logical database per service); stackra-250.
 */
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * Whether gen declares and connects a database for `ir`.
 *
 * @param ir - the member read by discovery.
 * @example
 * usesDatabase(commerceIr); // true: the orders module has a model
 */
export function usesDatabase(ir: MemberIR): boolean {
  return (
    ir.layout === "service" &&
    ((ir.packages ?? []).includes("@stackra/database") ||
      ir.dependencies.some((dependency) => dependency.package === "@stackra/database") ||
      ir.classes.some((declared) => declared.kind === "model") ||
      ir.dependencies.some(({ manifest }) => (manifest.models ?? []).length > 0))
  );
}
