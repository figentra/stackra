/**
 * Stackra file contract:
 * Purpose: `checkEncryptedFields`, the gen checks of the model encryption path: a `HasEncryptedFields` field the
 *          model does not declare (`encrypted_field_unknown`), one without `@Classified` (`encrypted_field_unclassified`:
 *          the classification and the encryption are two statements of one fact, so they must agree; a `@Classify`
 *          class alone does not count, since the logger's `redact`, the panel export and change capture read only
 *          `@Classified`, so a field without it would reach a log line or an export in clear once decrypted), a field
 *          whose data class says `encrypt: sealed` that `HasEncryptedFields`
 *          does not name (`credential_field_not_encrypted` for a `credential` field, a provider secret never rests in
 *          clear, ADR 0494; `classified_field_not_encrypted` for any other class), one whose class says
 *          `subject_sealed` sealed without the `subject` option (`classified_field_not_subject_sealed`), and a write
 *          that skips the unit of work on an encrypted model, by its class or its table (`encrypted_native_write`: the
 *          `EncryptedFieldsSubscriber` never sees it, so the value would rest in clear).
 * Boundary: pure, over the IR. Encrypted models are the member's own (its model shapes and their traits) and its
 *           declared packages' (manifest `models` with `HasEncryptedFields`); a package's fields are not re-checked
 *           here, its own gen does that. A field's class is `fieldDataClassOf`'s, the one classification source; the
 *           `PersonalData` erasure methods are checked by `checkPersonalData`.
 * Runtime: isomorphic
 * Governing contract: ADR 0465 (decision 5: the model encryption path); ADR 0134 (decision 2: classification); ADR 0494 (credential);
 *                     ADR 0540 (decision 1: the `encrypt` effect).
 */
import { classifyOptionsOf } from "#core/functions/classify-options-of.function";
import { fieldDataClassOf } from "#core/functions/field-data-class-of.function";
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
    const keyed = trait?.args[0] as { readonly subject?: unknown } | undefined;
    const subjectKeyed = typeof keyed === "object" && keyed !== null && keyed.subject !== undefined;
    // A field whose class says sealed rests encrypted (a `credential` always, ADR 0494 rule 1; ADR 0540 decision 1).
    for (const field of ir.shapes.find(
      (candidate) => candidate.name === declared.name && candidate.file === declared.file,
    )?.fields ?? []) {
      const dataClass = fieldDataClassOf(declared, field);
      const encrypt = dataClass?.effects.encrypt ?? "clear";
      const at = {
        file: declared.file,
        line: 0,
        column: 0,
        subject: `${declared.name}.${field.name}`,
      };
      if (encrypt === "clear") continue;
      if (!trait?.args.includes(field.name)) {
        const credential = field.classified === "credential" || dataClass?.key === "credential";
        errors.push({
          ...at,
          code: credential ? "credential_field_not_encrypted" : "classified_field_not_encrypted",
          message: credential
            ? `${declared.name}.${field.name} is classified credential but is not encrypted, so a provider secret would rest in clear`
            : `${declared.name}.${field.name} is classified "${dataClass?.key}", whose data class rests ${encrypt}, but is not encrypted, so it would rest in clear`,
          fix:
            encrypt === "subject_sealed"
              ? `add \`"${field.name}"\` to HasEncryptedFields({ subject: "<subject property>" }, ...) on ${declared.name}`
              : `add \`"${field.name}"\` to HasEncryptedFields on ${declared.name}`,
        });
      } else if (encrypt === "subject_sealed" && !subjectKeyed)
        errors.push({
          ...at,
          code: "classified_field_not_subject_sealed",
          message: `${declared.name}.${field.name} is classified "${dataClass?.key}", whose data class rests subject_sealed, but ${declared.name}'s HasEncryptedFields names no subject, so erasing the subject cannot shred it`,
          fix: `give ${declared.name}'s HasEncryptedFields the subject option: HasEncryptedFields({ subject: "<subject property>" }, ...)`,
        });
    }
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
        // `@Classify` alone is not enough: the readers that keep a value out of logs and exports (`redact` of
        // @stackra/logger, the panel export, `changeCaptureOf`) read only `@Classified` (ADR 0540, decision 6).
        errors.push({
          ...at,
          code: "encrypted_field_unclassified",
          message:
            classifyOptionsOf(declared, field) === undefined
              ? `${declared.name}.${field} is encrypted but carries no @Classified class, so export, erasure and the logs do not treat it as personal or regulated data`
              : `${declared.name}.${field} is encrypted and carries @Classify but no @Classified class; the log redaction and the exports read only @Classified, so its decrypted value would be logged and exported in clear`,
          fix: `add \`@Classified(DataClassification.<Class>)\` to ${field} (Personal, Financial, Health, Pseudonymous, Regulated or Credential), alongside any @Classify`,
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
