/**
 * Stackra file contract:
 * Purpose: `DATA_CLASS_IR`, IR builders for the data-class checks: a clinical-note class's options, a model with traits
 *          and field facets, a field, a model's shape, a `@Classify` facet, a `PersonalData` declaration, and the
 *          commerce member holding them.
 * Boundary: test only; plain IR values, no source read.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0540.
 */
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { FacetUse } from "#core/types/facet-use.type";
import type { FieldIR } from "#core/types/field-ir.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { ShapeIR } from "#core/types/shape-ir.type";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";

/** The fixture's `Order` model, the template of every model here. */
const ORDER = COMMERCE_IR.classes.find((candidate) => candidate.name === "Order") as DeclaredClass;

/** The builders. */
export const DATA_CLASS_IR = Object.freeze({
  /** A clinical-note class: the strictest keeping effects. */
  CLINICAL_NOTE: Object.freeze({
    key: "clinical_note",
    ai: "never",
    support: "hidden",
    search: "no_snippet",
    export: "labelled",
    encrypt: "subject_sealed",
    erasure: "shred",
    retention: "required",
    mask: "null",
  }),

  /** A model `name` with `traits` and `facets`. */
  model(
    name: string,
    traits: DeclaredClass["traits"] = [],
    facets: readonly FacetUse[] = [],
  ): DeclaredClass {
    return {
      ...ORDER,
      name,
      file: `src/modules/orders/models/${name.toLowerCase()}.model.ts`,
      facets,
      traits,
    };
  },

  /** A string data field `name`, classified `classified` when given. */
  field(name: string, classified?: string, nullable = true): FieldIR {
    return {
      name,
      optional: false,
      nullable,
      type: { kind: "string" },
      rules: [],
      ...(classified === undefined ? {} : { classified }),
    };
  },

  /** The shape of `declared` with `fields`. */
  shapeOf(declared: DeclaredClass, fields: readonly FieldIR[]): ShapeIR {
    return {
      name: declared.name,
      kind: "model",
      module: declared.module,
      file: declared.file,
      importPath: declared.importPath,
      fields,
      relations: [],
    };
  },

  /** `@Classify(Class)` on `member`, with the class's constant options. */
  classify(member: string, dataClass: Readonly<Record<string, unknown>>): FacetUse {
    return {
      name: "Classify",
      kind: "classify",
      target: "field",
      member,
      options: {
        $class: "NoteDataClass",
        from: "#modules/orders/access/note.data-class",
        dataClass,
      },
      from: "@stackra/model",
    };
  },

  /** A `PersonalData({ model, subject, fields })` declaration of `target`. */
  personalData(
    target: string,
    subject: string,
    fields?: Readonly<Record<string, string>>,
  ): DeclaredClass {
    return {
      ...ORDER,
      name: `${target}PersonalData`,
      kind: "personal_data",
      file: `src/modules/orders/privacy/${target.toLowerCase()}.personal-data.ts`,
      options: {
        model: { $class: target, from: "#modules/orders/models", kind: "model" },
        subject,
        ...(fields === undefined ? {} : { fields }),
      },
      facets: [],
      traits: [],
    };
  },

  /** The commerce member with `classes` and `shapes` added. */
  irOf(classes: readonly DeclaredClass[], shapes: readonly ShapeIR[]): MemberIR {
    return {
      ...COMMERCE_IR,
      classes: [...COMMERCE_IR.classes, ...classes],
      shapes: [...COMMERCE_IR.shapes, ...shapes],
    };
  },
});
