/**
 * Stackra file contract:
 * Purpose: `factoryPairsOf`, the own factories of a member that name their model (`Factory<Order>`), in file order.
 *          The manifest's `factories` section, the seed entry and the Vitest setup register these pairs (STA-2061).
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0190 (factories and seeders).
 */
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** A factory with the model it builds. */
type FactoryPair = DeclaredClass & { readonly partner: NonNullable<DeclaredClass["partner"]> };

/**
 * The own factories of `ir` that name a model.
 *
 * @param ir - the member read by discovery.
 * @example
 * factoryPairsOf(ir).map((factory) => [factory.name, factory.partner.name]); // [["OrderFactory", "Order"]]
 */
export function factoryPairsOf(ir: MemberIR): FactoryPair[] {
  return ir.classes.filter(
    (declared): declared is FactoryPair =>
      declared.kind === "factory" && declared.partner !== undefined,
  );
}
