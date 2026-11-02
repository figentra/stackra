/**
 * Stackra file contract:
 * Purpose: `usesPanel(ir)`, whether a member hosts `@stackra/panel`: it declares the package, or a dependency that
 *          commits a manifest is the panel itself.
 * Boundary: pure; reads the declared package names and the dependency manifests only.
 * Runtime: isomorphic
 * Governing contract: ADR 0164 (decision 2); ADR 0307; STA-1947.
 */
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * Whether `ir` hosts the panel.
 *
 * @example
 * usesPanel(consoleIr); // true
 */
export function usesPanel(ir: MemberIR): boolean {
  return (
    (ir.packages ?? []).includes("@stackra/panel") ||
    ir.dependencies.some((dependency) => dependency.package === "@stackra/panel")
  );
}
