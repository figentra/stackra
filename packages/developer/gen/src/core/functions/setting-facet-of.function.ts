/**
 * Stackra file contract:
 * Purpose: `settingFacetOf`, the `@Setting` options of one field of a class, read from the member's declared classes.
 * Boundary: pure; shared by `emitSettings` and `settingsOf`, so both read one field the same way.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 22 to 24).
 */
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The `@Setting` options of `owner.member`, or undefined when it carries none.
 *
 * @param ir - the member read by discovery.
 * @param owner - the class that declares the field, by name and module.
 * @param member - the field name.
 * @example
 * settingFacetOf(ir, { name: "OrdersSettings", module: "orders" }, "maxOpenOrders"); // { approval: true }
 */
export function settingFacetOf(
  ir: MemberIR,
  owner: { readonly name: string; readonly module: string },
  member: string,
): Readonly<Record<string, unknown>> | undefined {
  const facet = ir.classes
    .find((declared) => declared.name === owner.name && declared.module === owner.module)
    ?.facets.find(
      (candidate) =>
        candidate.name === "Setting" && candidate.target === "field" && candidate.member === member,
    );
  if (facet === undefined) return undefined;
  return typeof facet.options === "object" && facet.options !== null
    ? (facet.options as Readonly<Record<string, unknown>>)
    : {};
}
