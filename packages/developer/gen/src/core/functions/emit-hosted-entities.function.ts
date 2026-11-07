/**
 * Stackra file contract:
 * Purpose: `emitHostedEntities`, a service's entity files for the packages it hosts
 *          (`.stackra/gen/entities/hosted/<package member>/<module>.ts`): each hosted model's `EntitySchema`, written
 *          by `emitEntities` from the `entity` facts the package's manifest records (`modelEntityFacts`), over the
 *          model classes the package's entry exports. Loading a file registers its schemas, so the service no longer
 *          imports a `<MODULE>_ENTITIES` list that no package barrel exports (STA-1667).
 * Boundary: pure; a service only, and only for a package whose every model records its entity facts (an older
 *           manifest without them keeps the `registerEntities` import of `emitRegistrations`). A model a package
 *           re-declares from another (`from`) is that package's to register.
 * Runtime: isomorphic
 * Governing contract: ADR 0097 (decisions 3 and 5.4: gen emits EntitySchema, no runtime scan); ADR 0158 (the
 *                     manifest is the contract).
 */
import type { StackraManifest } from "@stackra/contracts";

import { emitEntities } from "#core/functions/emit-entities.function";
import { packageSpecifier } from "#core/functions/package-specifier.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { FieldIR } from "#core/types/field-ir.type";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { RelationIR } from "#core/types/relation-ir.type";
import type { ShapeIR } from "#core/types/shape-ir.type";
import type { TypeDesc } from "#core/types/type-desc.type";

/** A model's `entity` facts, as `modelEntityFacts` writes them. */
interface EntityFacts {
  readonly module: string;
  readonly fields: readonly {
    readonly name: string;
    readonly optional: boolean;
    readonly nullable: boolean;
    readonly type: TypeDesc;
    readonly int?: true;
    readonly default?: string | number | boolean;
  }[];
  readonly relations: readonly {
    readonly name: string;
    readonly kind: RelationIR["kind"];
    readonly target: string;
    readonly targetModule?: string;
    readonly nullable: boolean;
    readonly ref: boolean;
    readonly inverse?: string;
    readonly options: Readonly<Record<string, unknown>>;
  }[];
  readonly optional: readonly string[];
  readonly computed: readonly string[];
}

/** The hosted models of `manifest` with their facts, or undefined when one records none. */
function hostedModels(manifest: StackraManifest):
  | {
      readonly model: NonNullable<StackraManifest["models"]>[number];
      readonly facts: EntityFacts;
    }[]
  | undefined {
  const models = (manifest.models ?? []).filter((model) => model["from"] === undefined);
  const facts = models.map((model) => model["entity"] as EntityFacts | undefined);
  if (models.length === 0 || facts.some((entry) => entry === undefined)) return undefined;
  return models.map((model, index) => ({ model, facts: facts[index] as EntityFacts }));
}

/**
 * The packages `ir` hosts whose entity schemas the service writes, with the import of each file.
 *
 * @param ir - the member read by discovery.
 * @example
 * emitHostedEntities(ir).map((file) => file.path); // [".stackra/gen/entities/hosted/content/content.ts"]
 */
export function emitHostedEntities(ir: MemberIR): GeneratedFile[] {
  if (ir.layout !== "service") return [];
  const files: GeneratedFile[] = [];
  for (const { package: name, manifest } of ir.dependencies) {
    if (manifest.kind === "app") continue;
    const hosted = hostedModels(manifest);
    if (hosted === undefined) continue;
    const specifierOf = (className: string): string => {
      const file = hosted.find(({ model }) => model["class"] === className)?.model["file"];
      return typeof file === "string" ? packageSpecifier(name, file) : name;
    };
    const shapes: ShapeIR[] = hosted.map(({ model, facts }) => {
      const className = String(model["class"]);
      const file = String(model["file"]);
      const fields: FieldIR[] = facts.fields.map((field) => ({
        name: field.name,
        optional: field.optional,
        nullable: field.nullable,
        type: field.type,
        rules: field.int === true ? [{ name: "Int", options: {} }] : [],
        ...(field.default === undefined
          ? {}
          : {
              default: { value: field.default, code: JSON.stringify(field.default), imports: [] },
            }),
      }));
      const relations: RelationIR[] = facts.relations.map((relation) => ({
        name: relation.name,
        kind: relation.kind,
        target: { name: relation.target, from: specifierOf(relation.target) },
        ...(relation.targetModule === undefined ? {} : { targetModule: relation.targetModule }),
        nullable: relation.nullable,
        ref: relation.ref,
        ...(relation.inverse === undefined ? {} : { inverse: relation.inverse }),
        options: relation.options,
      }));
      return {
        name: className,
        kind: "model",
        module: facts.module,
        file,
        importPath: packageSpecifier(name, file),
        fields,
        relations: relations.map((relation) => relation.name),
        // No `[OptionalProps]` augmentation: the package's own types carry it, and a second, different declaration on
        // its class is TS2717 in the host (STA-1667). The schema's properties do not depend on it.
        entity: { optional: [], relations, computed: facts.computed },
      };
    });
    const classes: DeclaredClass[] = hosted.map(({ model, facts }) => ({
      name: String(model["class"]),
      kind: "model",
      module: facts.module,
      file: String(model["file"]),
      importPath: packageSpecifier(name, String(model["file"])),
      options: {},
      deps: [],
      facets: [],
      methods: [],
      refusals: [],
      statics: {},
      traits: model.traits.map((trait) => ({ name: trait, args: [] })),
    }));
    const view: MemberIR = { ...ir, shapes, classes };
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    for (const module of [...new Set(shapes.map((shape) => shape.module))].sort()) {
      const content = emitEntities(view, module, true);
      if (content !== undefined)
        files.push({
          path: `.stackra/gen/entities/hosted/${manifest.member}/${module}.ts`,
          content,
        });
    }
  }
  return files;
}
