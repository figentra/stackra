/**
 * Stackra file contract:
 * Purpose: `moduleEdges`, each own module of a member to the own modules it depends on: a constructor token that is
 *          a class of another own module, through a `#` import, sorted. Shared by the wiring, the manifest's module
 *          rows and the seeders' order (STA-2061).
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 24: sibling modules); ADR 0263 (module graph).
 */
import { moduleDependsOn } from "#core/functions/module-depends-on.function";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * Each own module's dependencies, keyed by module (`moduleDependsOn` per module).
 *
 * @example
 * moduleEdges(ir); // Map { "billing" => ["tenants"], "tenants" => [] }
 */
export function moduleEdges(ir: MemberIR): Map<string, string[]> {
  return new Map(ir.modules.map((key) => [key, moduleDependsOn(ir, key)]));
}
