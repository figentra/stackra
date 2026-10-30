/**
 * Stackra file contract:
 * Purpose: `modelEntityFacts`, the `entity` section of a model's manifest entry: its module, its fields (name,
 *          optional, nullable, type, whether `@Int`, a constant default), its relations (target class and module,
 *          kind, nullable, ref, inverse, `orphanRemoval` and `pivotTable`) and the keys a create may leave out and
 *          the computed getters, so a service that hosts the package writes the package's entity schemas from the
 *          manifest alone (`emitHostedEntities`, STA-1667).
 * Boundary: pure; JSON only. Exactly what `emitEntities` reads, nothing about validation or the wire.
 * Runtime: isomorphic
 * Governing contract: ADR 0158 (the manifest is the contract); ADR 0097 (decision 5.4: gen emits EntitySchema, no
 *                     runtime scan).
 */
import type { ShapeIR } from "#core/types/shape-ir.type";

/**
 * The entity facts of the model `shape`.
 *
 * @param shape - a model read by discovery.
 * @example
 * modelEntityFacts(orderShape).fields[0]; // { name: "id", optional: true, nullable: false, type: { kind: "public_id", prefix: "ord" } }
 */
export function modelEntityFacts(shape: ShapeIR): Record<string, unknown> {
  return {
    module: shape.module,
    fields: shape.fields.map((field) => {
      const value = field.default?.value;
      return {
        name: field.name,
        optional: field.optional,
        nullable: field.nullable,
        type: field.type,
        ...(field.rules.some((rule) => rule.name === "Int") ? { int: true } : {}),
        ...(typeof value === "string" || typeof value === "number" || typeof value === "boolean"
          ? { default: value }
          : {}),
      };
    }),
    relations: (shape.entity?.relations ?? []).map((relation) => ({
      name: relation.name,
      kind: relation.kind,
      target: relation.target.name,
      ...(relation.targetModule === undefined ? {} : { targetModule: relation.targetModule }),
      nullable: relation.nullable,
      ref: relation.ref,
      ...(relation.inverse === undefined ? {} : { inverse: relation.inverse }),
      options: Object.fromEntries(
        Object.entries(relation.options).filter(
          ([key, value]) =>
            (key === "orphanRemoval" && value === true) ||
            (key === "pivotTable" && typeof value === "string"),
        ),
      ),
    })),
    optional: shape.entity?.optional ?? [],
    computed: shape.entity?.computed ?? [],
  };
}
