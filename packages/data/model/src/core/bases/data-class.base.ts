/**
 * Stackra file contract:
 * Purpose: `DataClass({ key, ai, support, search, export, encrypt, erasure, retention, mask })`, the kind factory of a
 *          data class: a product declares a class of protected data beside the built-in ones, in its module's
 *          `access/<name>.data-class.ts`, and a field carries it with `@Classify(Class)`.
 * Boundary: a called-only kind base, registered as `data_class`; it checks the key and every effect and records them as
 *           the static `dataClass`. The AI context builder, support access, the search indexer and the export writer
 *           read the access effects; gen, the model encryption path, erasure, retention and the masker read the keeping
 *           effects (through `fieldDataClasses`). Gen adds each declared class to the product's `@Classify` union and
 *           refuses a key that two classes share. A tenant never declares one.
 * Runtime: isomorphic
 * Governing contract: ADR 0341 (decisions 1, 2, 4 and 5); ADR 0540 (decision 1: eight effects, each required); ADR 0294
 *                     (decision 13 as amended 2026-10-24); ADR 0305 (kind factories take no `define` prefix); ADR 0231
 *                     (snake_case machine codes).
 */
import { DATA_CLASS_EFFECT_RANKS } from "@stackra/contracts";
import { registerKind } from "@stackra/container";

import type { DataClassOptions } from "#core/types/data-class-options.type";
import type { DataClassRef } from "#core/types/data-class-ref.type";

/** A data class key: snake_case. */
const KEY = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

/**
 * The base of a data class.
 *
 * @throws TypeError when `key` is not snake_case.
 * @throws RangeError when an effect is missing or holds a code its effect does not have.
 * @example
 * export class ClinicalNoteDataClass extends DataClass({
 *   key: "clinical_note",
 *   ai: AiAudience.Never,
 *   support: SupportAccess.Hidden,
 *   search: SearchSnippet.NoSnippet,
 *   export: ExportLabel.Labelled,
 *   encrypt: FieldEncryption.SubjectSealed,
 *   erasure: SubjectErasure.Shred,
 *   retention: RetentionBound.Required,
 *   mask: MaskMethod.Null,
 * }) {}
 */
export function DataClass(options: DataClassOptions): DataClassRef & (abstract new () => object) {
  if (!KEY.test(options.key))
    throw new TypeError(`DataClass: "${options.key}" is not a snake_case class key`);
  for (const [effect, codes] of Object.entries(DATA_CLASS_EFFECT_RANKS)) {
    const code: unknown = (options as unknown as Readonly<Record<string, unknown>>)[effect];
    if (typeof code !== "string" || !Object.hasOwn(codes, code))
      throw new RangeError(
        `DataClass "${options.key}": ${effect} must be one of ${Object.keys(codes).join(", ")}, got ${JSON.stringify(code)}`,
      );
  }
  const dataClass = Object.freeze({ ...options });
  // oxlint-disable-next-line typescript/no-extraneous-class -- reason: a data class is read by its statics only
  abstract class Declared {
    /** The class's key and effects. */
    static readonly dataClass: DataClassOptions = dataClass;
  }
  registerKind(Declared, "data_class", dataClass);
  return Declared;
}
