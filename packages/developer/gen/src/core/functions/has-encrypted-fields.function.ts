/**
 * Stackra file contract:
 * Purpose: `hasEncryptedFields(ir)`, whether a member's rows carry encrypted fields: one of its own models, or a
 *          declared package's, has the `HasEncryptedFields` trait. The boot then seals them with the
 *          `EncryptedFieldsSubscriber` over `FieldCipher`, and the wiring binds that cipher.
 * Boundary: pure; reads the member's classes and its dependencies' manifests.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 17); registry gaps R-27 and R-36 (owner decision 23).
 */
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * True when the member or a declared package has a model with encrypted fields.
 *
 * @param ir - the member read by discovery.
 * @example
 * hasEncryptedFields(ir); // true for a service whose Party model is HasEncryptedFields
 */
export function hasEncryptedFields(ir: MemberIR): boolean {
  return (
    ir.classes.some(
      (declared) =>
        declared.kind === "model" &&
        declared.traits.some((trait) => trait.name === "HasEncryptedFields"),
    ) ||
    ir.dependencies.some(({ manifest }) =>
      (manifest.models ?? []).some((model) => model.traits.includes("HasEncryptedFields")),
    )
  );
}
