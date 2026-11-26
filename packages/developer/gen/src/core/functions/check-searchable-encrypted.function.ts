/**
 * Stackra file contract:
 * Purpose: `checkSearchableEncrypted`, the refusal `searchable_field_encrypted`: an own model's `@Searchable` text,
 *          filter, sortable or range path ends at a field that `HasEncryptedFields` keeps sealed at rest. The index reads
 *          the loaded row, which holds that field opened, so its plain text would rest in the search columns, reach the
 *          embedder of a `semantic: true` facet and show in snippets.
 * Boundary: pure; reads the IR only. A path is followed through the member's own models, as `checkSemanticSearch` does:
 *           a plain field, a field an own base model encrypts, and a dotted path (`allergies.reaction`) through a
 *           relation to an own model. A field of a package model is not seen here; `refuseEncryptedSearchPath` in
 *           @stackra/search refuses it at index time. An encrypted field that keeps a blind index (`lookup`) is found by
 *           `whereEncrypted`, never by search, so it is refused too.
 * Runtime: isomorphic
 * Governing contract: ADR 0465 (decision 5: the model encryption path); ADR 0294 (decision 22: a refusal carries its
 *                     fix; decision 27); ADR 0221 (decisions 1 to 3); STA-2241.
 */
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** The facet options whose paths a search document stores. */
const STORED = ["text", "filters", "sortable", "ranges"] as const;

/**
 * The `searchable_field_encrypted` refusals of `ir`.
 *
 * @param ir - the member read by discovery.
 * @example
 * checkSearchableEncrypted(ir).map((refusal) => refusal.subject); // ["Patient.diagnosis"]
 */
export function checkSearchableEncrypted(ir: MemberIR): GenError[] {
  const models = new Map(
    ir.classes
      .filter((declared) => declared.kind === "model")
      .map((declared) => [declared.name, declared]),
  );
  const shapes = new Map(ir.shapes.map((shape) => [shape.name, shape]));

  /** Whether `model` or an own base model names `field` with `HasEncryptedFields`. */
  const encrypts = (model: DeclaredClass, field: string, seen: Set<string>): boolean => {
    if (seen.has(model.name)) return false;
    seen.add(model.name);
    const trait = model.traits.find((use) => use.name === "HasEncryptedFields");
    if (trait?.args.includes(field) === true) return true;
    const base = model.base?.own === true ? models.get(model.base.name) : undefined;
    return base !== undefined && encrypts(base, field, seen);
  };

  /** The model and field a path ends at, following relations to own models; undefined when it leaves them. */
  const endOf = (
    model: DeclaredClass,
    path: string,
  ): { readonly model: DeclaredClass; readonly field: string } | undefined => {
    const [head = "", ...rest] = path.split(".");
    if (rest.length === 0) return { model, field: head };
    const relation = shapes.get(model.name)?.entity?.relations.find((each) => each.name === head);
    const target = relation === undefined ? undefined : models.get(relation.target.name);
    return target === undefined ? undefined : endOf(target, rest.join("."));
  };

  const errors: GenError[] = [];
  for (const model of models.values()) {
    const options = model.facets.find(
      (facet) => facet.name === "Searchable" && facet.target === "class",
    )?.options as Readonly<Partial<Record<(typeof STORED)[number], unknown>>> | undefined;
    if (options === undefined) continue;
    const paths = new Set(
      STORED.flatMap((option) => {
        const value = options[option];
        return Array.isArray(value)
          ? value.filter((path): path is string => typeof path === "string")
          : [];
      }),
    );
    for (const path of paths) {
      const end = endOf(model, path);
      if (end === undefined || !encrypts(end.model, end.field, new Set())) continue;
      errors.push({
        code: "searchable_field_encrypted",
        file: model.file,
        line: 0,
        column: 0,
        subject: `${model.name}.${path}`,
        message:
          `${model.name}'s @Searchable reads ${path}, which ${end.model.name} keeps sealed with HasEncryptedFields, ` +
          "so its plain text would rest in the search index (and reach the embedder and the snippets)",
        fix:
          `drop ${path} from the facet's text, filters, sortable and ranges; find a row by an encrypted value with ` +
          `HasEncryptedFields({ lookup: ["${end.field}"] }) and whereEncrypted instead`,
      });
    }
  }
  return errors;
}
