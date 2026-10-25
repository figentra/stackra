/**
 * Stackra file contract:
 * Purpose: `schemaModules`, the module keys that get a schemas file (`#stackra/schemas/<module>`): every module with a
 *          shape, an enum, an action, a query or a config, sorted.
 * Boundary: pure. `generateMember` writes one file per key, and the registrations load the same files, so both read
 *           the one list.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: the shape compiler); registry v3.1 gap G1.
 */
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The modules of `ir` that have a schemas file.
 *
 * @example
 * schemaModules(ir); // ["commerce", "orders"]
 */
export function schemaModules(ir: MemberIR): string[] {
  return [
    ...new Set([
      ...ir.shapes.map((shape) => shape.module),
      ...ir.enums.map((declaration) => declaration.module),
      ...ir.classes
        .filter(
          (declared) =>
            declared.kind === "action" || declared.kind === "query" || declared.kind === "config",
        )
        .map((declared) => declared.module),
    ]),
  ].sort();
}
