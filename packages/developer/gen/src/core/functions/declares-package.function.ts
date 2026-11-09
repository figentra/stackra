/**
 * Stackra file contract:
 * Purpose: `declaresPackage`, whether a member declares `name` as a dependency: the one test every emitter that is
 *          written only for a member on a package uses (`@stackra/app` for the HTTP adapter, `@stackra/versioning` for
 *          the versioned adapter).
 * Boundary: pure; reads `ir.packages` (the hosted and declared platform packages) and `ir.dependencies`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 17); ADR 0295 (decision 8); STA-2532.
 */
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * Whether `ir` declares `name`.
 *
 * @example
 * declaresPackage(ir, "@stackra/versioning"); // true for a member that versions its API
 */
export function declaresPackage(ir: MemberIR, name: string): boolean {
  return (
    (ir.packages ?? []).includes(name) ||
    ir.dependencies.some((dependency) => dependency.package === name)
  );
}
