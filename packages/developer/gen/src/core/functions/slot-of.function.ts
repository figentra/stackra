/**
 * Stackra file contract:
 * Purpose: `slotOf`, the slot a fill names: a slot the member declares itself (matched by const name and import path)
 *          or one a dependency's committed manifest lists under `slots` (matched by const name, the import naming
 *          the dependency's package or one of its entries).
 * Boundary: pure; reads `ir.slots` and `ir.dependencies`. A dependency is read from its manifest, never its source
 *           or `.d.ts`; a manifest written before stackra-03 has no `slots` and resolves nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0438; ADR 0260 (a dependency is read from its manifest); app-shells-edge-and-extension.md 7.2.
 */
import type { ClassRef } from "#core/types/class-ref.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { ResolvedSlot } from "#core/types/resolved-slot.type";

/**
 * The slot `ref` names, or undefined when neither the member nor a dependency declares it.
 *
 * @example
 * slotOf(ir, { name: "SignInBrandPanel", from: "@os/console-shell" })?.key; // "auth.sign_in.brand_panel"
 */
export function slotOf(ir: MemberIR, ref: ClassRef): ResolvedSlot | undefined {
  const own = (ir.slots ?? []).find(
    (slot) => slot.name === ref.name && slot.importPath === ref.from,
  );
  if (own !== undefined) return own;
  const dependency = ir.dependencies.find(
    (candidate) => ref.from === candidate.package || ref.from.startsWith(`${candidate.package}/`),
  );
  const slots = dependency?.manifest["slots"];
  if (!Array.isArray(slots)) return undefined;
  const found = (slots as readonly Record<string, unknown>[]).find(
    (slot) => slot["name"] === ref.name,
  );
  const key = found?.["key"];
  if (found === undefined || typeof key !== "string") return undefined;
  return {
    key,
    surface: String(found["surface"] ?? ""),
    cardinality: String(found["cardinality"] ?? "one"),
    props: (found["props"] ?? {}) as Readonly<Record<string, string>>,
  };
}
