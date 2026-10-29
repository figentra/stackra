/**
 * Stackra file contract:
 * Purpose: `checkBlindIndexes`, the gen checks of an encrypted field looked up by equal value
 *          (`HasEncryptedFields({ lookup: [...] }, ...fields)`, gap gov9): a lookup field the trait does not encrypt
 *          (`encrypted_lookup_unknown`), a lookup combined with `subject` (`encrypted_lookup_subject`: an index under
 *          the scope's key would still match an erased subject's value), a model that does not declare the
 *          `<field>Bidx: string | null` property the subscriber writes (`encrypted_lookup_undeclared`), and one whose
 *          `@Index` does not lead with it (`encrypted_lookup_not_indexed`: `whereEncrypted` would scan the table).
 * Boundary: pure, over the IR: the member's own models only (a package's are checked by its own gen). The column and
 *           its index are the migration's (ADR 0159); the entity schema maps the declared property like any other
 *           field, so nothing is emitted here.
 * Runtime: isomorphic
 * Governing contract: ADR 0465 (decision 5: the model encryption path); ADR 0294 (decision 22: a refusal carries its
 *                     fix); data-layer gap gov9 (STA-1482).
 */
import { snakeCase } from "@stackra/support";

import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** `value` as a plain object, or undefined. */
function objectOf(value: unknown): Readonly<Record<string, unknown>> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Readonly<Record<string, unknown>>)
    : undefined;
}

/**
 * The refusals of the blind-index checks.
 *
 * @param ir - the member read by discovery.
 * @example
 * checkBlindIndexes(ir).map((error) => error.code); // ["encrypted_lookup_not_indexed"]
 */
export function checkBlindIndexes(ir: MemberIR): GenError[] {
  const errors: GenError[] = [];
  for (const declared of ir.classes) {
    if (declared.kind !== "model") continue;
    const trait = declared.traits.find((use) => use.name === "HasEncryptedFields");
    const options = objectOf(trait?.args[0]);
    const lookup = Array.isArray(options?.["lookup"]) ? (options["lookup"] as unknown[]) : [];
    if (trait === undefined || lookup.length === 0) continue;
    const encrypted = new Set(trait.args.filter((arg) => typeof arg === "string"));
    const shape = ir.shapes.find(
      (candidate) => candidate.name === declared.name && candidate.file === declared.file,
    );
    const leading = new Set(
      declared.facets
        .filter(
          (facet) =>
            facet.target === "class" && facet.name === "Index" && Array.isArray(facet.options),
        )
        .map((facet) => (facet.options as readonly unknown[])[0]),
    );
    const at = (field: string): Omit<GenError, "code" | "message" | "fix"> => ({
      file: declared.file,
      line: 0,
      column: 0,
      subject: `${declared.name}.${field}`,
    });
    if (options?.["subject"] !== undefined)
      errors.push({
        ...at("lookup"),
        code: "encrypted_lookup_subject",
        message: `${declared.name} combines lookup with subject: a blind index under the scope's key would still match an erased subject's value`,
        fix: "drop `lookup`, or seal the model under the scope instead of a subject",
      });
    for (const field of lookup) {
      if (typeof field !== "string") continue;
      const index = `${field}Bidx`;
      if (!encrypted.has(field)) {
        errors.push({
          ...at(field),
          code: "encrypted_lookup_unknown",
          message: `HasEncryptedFields looks up ${field}, which it does not encrypt`,
          fix: `add "${field}" to the encrypted fields of HasEncryptedFields, or remove it from \`lookup\``,
        });
        continue;
      }
      const property = shape?.fields.find((candidate) => candidate.name === index);
      if (shape !== undefined && (property?.type.kind !== "string" || !property.nullable))
        errors.push({
          ...at(index),
          code: "encrypted_lookup_undeclared",
          message: `${declared.name} looks up ${field} but does not declare ${index}: string | null, so the subscriber refuses each write`,
          fix: `declare \`${index}: string | null = null;\` on ${declared.name} (column ${snakeCase(index)} in its migration)`,
        });
      if (!leading.has(index))
        errors.push({
          ...at(index),
          code: "encrypted_lookup_not_indexed",
          message: `no index of ${declared.name} leads with ${index}, so a whereEncrypted lookup scans the table`,
          fix: `add @Index(["${index}"]) to ${declared.name} and the index to its migration`,
        });
    }
  }
  return errors;
}
