/**
 * Stackra file contract:
 * Purpose: `ownClass`, the member's class a manifest entry names: the one of that name in its module, else the first
 *          of that name, so every emitter that reads an action entry resolves the same class.
 * Boundary: pure; reads `ir.classes` only. A hosted package's class is not the member's, so a caller checks `from`
 *           first.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20: identities from the manifest); STA-2025; STA-2063.
 */
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The class `name` of `ir`, preferring the one in `module`.
 *
 * @param ir - the member read by discovery.
 * @param name - the class name an entry records.
 * @param module - the module key it records, when any.
 * @example
 * ownClass(ir, "CancelOrderAction", "orders")?.importPath; // "#modules/orders/actions/cancel-order.action"
 */
export function ownClass(ir: MemberIR, name: unknown, module?: unknown): DeclaredClass | undefined {
  return (
    ir.classes.find((candidate) => candidate.name === name && candidate.module === module) ??
    ir.classes.find((candidate) => candidate.name === name)
  );
}
