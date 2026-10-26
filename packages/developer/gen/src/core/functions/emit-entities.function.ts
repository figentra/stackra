/**
 * Stackra file contract:
 * Purpose: `emitEntities`, the entity file of one module (`.stackra/gen/entities/<module>.ts`, reached as
 *          `#stackra/entities/<module>`): the `[OptionalProps]` augmentation of each model (every trait field, and
 *          every field or relation with an initializer, so a create may leave them out), one `EntitySchema` per model
 *          in the module's Postgres schema, the module's list `<MODULE>_ENTITIES`, and the `registerEntities` call that
 *          hands them to the database.
 * Boundary: pure. Runtime facts only: property types, the primary key, nullability, versions, `onUpdate`, enum items,
 *           constant defaults, relations with their inverse sides, embedded money and link columns. Column types,
 *           lengths, indexes and foreign keys are the migration's (ADR 0159), so none is written here. A getter is
 *           listed as not persisted, because `EntitySchema<T>` names every field of `T`. A `Translated` field gets
 *           `@stackra/model`'s `TranslatedType`, so it loads back as a `Translated`.
 * Runtime: isomorphic
 * Governing contract: ADR 0097 (decisions 3 and 5.4: gen emits EntitySchema, no runtime scan); ADR 0294 (decisions
 *                     20 and 28: tables per module schema, links); ADR 0159; the STA-335 entity-schema spike; ADR 0162
 *                     (decision 2: per-locale columns).
 */
import { entitiesName } from "#core/functions/entities-name.function";
import { generatedHeader } from "#core/functions/generated-header.function";
import { importLines } from "#core/functions/import-lines.function";
import { modelKey } from "#core/functions/model-key.function";
import { plural } from "#core/functions/plural.function";
import { snakeCase } from "#core/functions/snake-case.function";
import type { ClassRef } from "#core/types/class-ref.type";
import type { FieldIR } from "#core/types/field-ir.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { RelationIR } from "#core/types/relation-ir.type";
import type { ShapeIR } from "#core/types/shape-ir.type";

/** The ORM type of a scalar field. */
function ormType(field: FieldIR): string {
  switch (field.type.kind) {
    case "boolean":
      return "boolean";
    case "date":
      return "datetime";
    case "number":
      return field.rules.some((rule) => rule.name === "Int") ? "integer" : "double";
    case "string":
    case "brand":
    case "public_id":
    case "driver_name":
    // shortcut: a Duration column is read back as its ISO 8601 string; add a Duration ORM type when a model needs one.
    case "duration":
      return "string";
    default:
      return "json";
  }
}

/**
 * The entity file of `module`.
 *
 * @param ir - the member read by discovery.
 * @param module - the module key whose models the file holds.
 * @returns the file content, or undefined when the module declares no model.
 * @example
 * emitEntities(ir, "scope"); // "...export const ScopeNodeSchema = new EntitySchema<ScopeNode>({..."
 */
export function emitEntities(ir: MemberIR, module: string): string | undefined {
  const models = ir.shapes.filter((shape) => shape.kind === "model" && shape.module === module);
  if (models.length === 0) return undefined;
  const imports = new Map<string, Map<string, boolean>>();
  const local = new Map<string, string>();
  const use = (from: string, name: string, typeOnly = false): void => {
    const names = imports.get(from) ?? new Map<string, boolean>();
    names.set(name, typeOnly && (names.get(name) ?? true));
    imports.set(from, names);
  };
  /** The local name a class is printed by, importing it once. */
  const ref = (target: ClassRef): string => {
    const key = `${target.from}#${target.name}`;
    const known = local.get(key);
    if (known !== undefined) return known;
    const taken = new Set(local.values());
    let name = target.name;
    for (let index = 2; taken.has(name); index += 1) name = `${target.name}${index}`;
    local.set(key, name);
    use(target.from, name === target.name ? target.name : `${target.name} as ${name}`);
    return name;
  };
  use("@stackra/database", "EntitySchema");
  use("@stackra/database", "registerEntities");

  /** The model key a link names, from this member's models or a dependency's manifest. */
  const linkKey = (relation: RelationIR): string => {
    if (relation.targetModule !== undefined)
      return modelKey(relation.targetModule, relation.target.name);
    for (const { manifest } of ir.dependencies)
      for (const model of manifest.models ?? [])
        if (model["class"] === relation.target.name) return model.key;
    return modelKey(module, relation.target.name);
  };
  /** The relation of `target` that points back at `owner.field`, for `inversedBy`. */
  const inverseOf = (
    owner: ShapeIR,
    relation: RelationIR,
    kind: RelationIR["kind"],
  ): string | undefined =>
    ir.shapes
      .find((shape) => shape.kind === "model" && shape.name === relation.target.name)
      ?.entity?.relations.find(
        (candidate) =>
          candidate.kind === kind &&
          candidate.inverse === relation.name &&
          candidate.target.name === owner.name,
      )?.name;

  const augmentations: string[] = [];
  const schemas: string[] = [];
  let money = false;
  for (const shape of models) {
    const declared = ir.classes.find(
      (candidate) => candidate.kind === "model" && candidate.name === shape.name,
    );
    const traits = new Set((declared?.traits ?? []).map((trait) => trait.name));
    const className = ref({ name: shape.name, from: shape.importPath });
    const optional = shape.entity?.optional ?? [];
    if (optional.length > 0) {
      use("@stackra/database", "OptionalProps", true);
      augmentations.push(
        `declare module ${JSON.stringify(shape.importPath)} {`,
        `  interface ${shape.name} {`,
        `    [OptionalProps]?: ${optional.map((name) => JSON.stringify(name)).join(" | ")};`,
        "  }",
        "}",
        "",
      );
    }

    const properties: string[] = [];
    for (const field of shape.fields) {
      const nullable = field.nullable || field.optional ? ", nullable: true" : "";
      if (field.type.kind === "money") {
        money = true;
        properties.push(
          `    ${field.name}: { kind: "embedded", entity: () => MoneySchema, prefix: "${snakeCase(field.name)}_"${nullable} },`,
        );
        continue;
      }
      if (field.type.kind === "translated") use("@stackra/model", "TranslatedType");
      const parts =
        field.type.kind === "enum"
          ? ["enum: true", `items: ${JSON.stringify(field.type.values)}`]
          : field.type.kind === "translated"
            ? ["type: TranslatedType"]
            : [
                `type: ${JSON.stringify(field.name === "version" && traits.has("Versioned") ? "integer" : ormType(field))}`,
              ];
      if (field.name === "id" && traits.has("HasPublicId")) parts.push("primary: true");
      if (field.name === "updatedAt" && traits.has("Timestamps"))
        parts.push("onUpdate: () => new Date()");
      if (field.name === "version" && traits.has("Versioned")) parts.push("version: true");
      if (nullable !== "") parts.push("nullable: true");
      const value = field.default?.value;
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean")
        parts.push(`default: ${JSON.stringify(value)}`);
      properties.push(`    ${field.name}: { ${parts.join(", ")} },`);
    }
    for (const relation of shape.entity?.relations ?? []) {
      const nullable = relation.nullable ? ", nullable: true" : "";
      if (relation.kind === "link") {
        use("@stackra/model", "LinkType");
        properties.push(
          `    ${relation.name}: { type: new LinkType(${JSON.stringify(linkKey(relation))}), fieldName: "${snakeCase(relation.name)}_id"${nullable} },`,
        );
        continue;
      }
      const target = ref(relation.target);
      const parts = [`kind: "${relation.kind}"`, `entity: () => ${target}`];
      if ((relation.kind === "m:1" || relation.kind === "1:1") && relation.ref)
        parts.push("ref: true");
      if (relation.kind === "m:1") {
        const inversedBy = inverseOf(shape, relation, "1:m");
        if (inversedBy !== undefined) parts.push(`inversedBy: "${inversedBy}"`);
      }
      if (relation.kind === "1:1") {
        if (relation.inverse !== undefined) parts.push(`mappedBy: "${relation.inverse}"`);
        else {
          parts.push("owner: true");
          const inversedBy = inverseOf(shape, relation, "1:1");
          if (inversedBy !== undefined) parts.push(`inversedBy: "${inversedBy}"`);
        }
      }
      if (relation.kind === "1:m") {
        if (relation.inverse !== undefined) parts.push(`mappedBy: "${relation.inverse}"`);
        if (relation.options["orphanRemoval"] === true) parts.push("orphanRemoval: true");
      }
      if (relation.kind === "m:n") {
        // shortcut: the declaring side owns a many-to-many; a two-sided many-to-many needs a `mappedBy` option first.
        parts.push("owner: true");
        const pivot = relation.options["pivotTable"];
        if (typeof pivot === "string") parts.push(`pivotTable: "${module}.${pivot}"`);
      }
      if (nullable !== "") parts.push("nullable: true");
      properties.push(`    ${relation.name}: { ${parts.join(", ")} },`);
    }
    for (const name of shape.entity?.computed ?? [])
      properties.push(`    ${name}: { type: "json", persist: false },`);

    schemas.push(
      `/** \`${modelKey(module, shape.name)}\` (${shape.file}). */`,
      `export const ${shape.name}Schema = new EntitySchema<${className}>({`,
      `  class: ${className},`,
      `  schema: ${JSON.stringify(module)},`,
      `  tableName: ${JSON.stringify(plural(snakeCase(shape.name)))},`,
      "  properties: {",
      ...properties,
      "  },",
      "});",
      "",
    );
  }
  if (money) use("@stackra/model", "MoneySchema");

  const list = entitiesName(module);
  const header = generatedHeader({
    from: `the model classes of module ${module}`,
    purpose:
      `the entities of module \`${module}\`: each model's \`[OptionalProps]\` (trait fields and initialized fields a ` +
      "create may leave out), one `EntitySchema` per model in the module's Postgres schema, and their registration.",
    boundary:
      "runtime facts only; columns, indexes and foreign keys are the migration's. Loading this file registers the " +
      `schemas; a package's \`node\` entry re-exports \`${list}\` for its host.`,
    runtime: "node",
  });
  return [
    header,
    ...importLines(imports),
    "",
    ...augmentations,
    ...schemas,
    `/** Every entity of module \`${module}\`. */`,
    `export const ${list}: readonly EntitySchema[] = [${[...(money ? ["MoneySchema"] : []), ...models.map((shape) => `${shape.name}Schema`)].join(", ")}];`,
    "",
    `registerEntities(${list});`,
    "",
  ].join("\n");
}
