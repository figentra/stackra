/**
 * Stackra file contract:
 * Purpose: `checkEncryptedFields`, the gen checks of the model encryption path: a `HasEncryptedFields` field the
 *          model does not declare (`encrypted_field_unknown`), one that carries no `@Classified` class
 *          (`encrypted_field_unclassified`: the classification and the encryption are two statements of one fact,
 *          so they must agree), and a write that skips the unit of work on an encrypted model, by its class or its
 *          table (`encrypted_native_write`: the `EncryptedFieldsSubscriber` never sees it, so the value would rest in
 *          clear).
 * Boundary: pure, over the IR. Encrypted models are the member's own (its model shapes and their traits) and its
 *           declared packages' (manifest `models` with `HasEncryptedFields`); a package's fields are not re-checked
 *           here, its own gen does that. The `PersonalData` erasure methods are not compared yet: gen does not read
 *           them (gov3 is one `DataClass` declaration, stackra-314).
 * Runtime: isomorphic
 * Governing contract: ADR 0465 (decision 5: the model encryption path); ADR 0134 (decision 2: classification).
 */
import { tableName } from "#core/functions/table-name.function";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The refusals of the encryption checks.
 *
 * @example
 * checkEncryptedFields(ir).map((error) => error.code); // ["encrypted_native_write"]
 */
export function checkEncryptedFields(ir: MemberIR): GenError[] {
  const errors: GenError[] = [];
  /** Encrypted model class names and tables, own and declared packages'. */
  const classes = new Set<string>();
  const tables = new Set<string>();
  for (const declared of ir.classes) {
    if (declared.kind !== "model") continue;
    const trait = declared.traits.find((use) => use.name === "HasEncryptedFields");
    if (trait === undefined) continue;
    classes.add(declared.name);
    tables.add(tableName(declared.module, declared.name));
    const shape = ir.shapes.find(
      (candidate) => candidate.name === declared.name && candidate.file === declared.file,
    );
    for (const field of trait.args) {
      if (typeof field !== "string") continue;
      const read = shape?.fields.find((candidate) => candidate.name === field);
      const at = { file: declared.file, line: 0, column: 0, subject: `${declared.name}.${field}` };
      if (shape !== undefined && read === undefined)
        errors.push({
          ...at,
          code: "encrypted_field_unknown",
          message: `HasEncryptedFields names ${field}, which ${declared.name} does not declare`,
          fix: `declare \`${field}\` on ${declared.name}, or remove it from HasEncryptedFields`,
        });
      else if (read !== undefined && read.classified === undefined)
        errors.push({
          ...at,
          code: "encrypted_field_unclassified",
          message: `${declared.name}.${field} is encrypted but carries no @Classified class, so export, erasure and the logs do not treat it as personal or regulated data`,
          fix: `add \`@Classified(DataClassification.<Class>)\` to ${field} (Personal, Financial, Health, Pseudonymous or Regulated)`,
        });
    }
  }
  for (const { manifest } of ir.dependencies)
    for (const model of manifest.models ?? [])
      if (model.traits.includes("HasEncryptedFields")) {
        if (typeof model["class"] === "string") classes.add(model["class"]);
        if (typeof model["table"] === "string") tables.add(model["table"]);
      }
  // A raw statement may name the table without its schema.
  const bare = new Set([...tables].map((table) => table.slice(table.indexOf(".") + 1)));
  for (const write of ir.nativeWrites ?? []) {
    const hit =
      write.method === "sql"
        ? tables.has(write.target) || bare.has(write.target)
        : classes.has(write.target);
    if (hit)
      errors.push({
        code: "encrypted_native_write",
        file: write.file,
        line: write.line,
        column: write.column,
        subject: write.target,
        message: `this ${write.method === "sql" ? "raw SQL" : write.method} write on ${write.target} skips the unit of work, so its encrypted fields would be stored in clear`,
        fix: "write through the repository or CrudService (em.persist and flush), where the EncryptedFieldsSubscriber seals the fields",
      });
  }
  return errors;
}
