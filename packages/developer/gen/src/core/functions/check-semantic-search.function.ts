/**
 * Stackra file contract:
 * Purpose: `checkSemanticSearch`, the refusal `searchable_semantic_ai_never`: a model whose `@Searchable` says
 *          `semantic: true` has its text fields embedded by a model provider, so none of them may carry a data class
 *          whose `ai` effect is `never` (ADR 0380 decision 3: a field of that class is never given to a model).
 * Boundary: pure; reads the IR only. A text path is followed through the member's own models: a plain field, a field an
 *           own base model declares, and a dotted path (`notes.body`) through a relation to an own model. A field of a
 *           package model, or a class whose effects are not constants, is not seen here; a runtime check belongs with
 *           semantic indexing in @stackra/search, which is not built yet. The data class's effects come from the
 *           `@Classify` facet's `options.dataClass`, which the source reader fills. Until `SearchableOptions` (in
 *           @stackra/model) gains `semantic`, no source can say it, so this refuses nothing yet.
 * Runtime: isomorphic
 * Governing contract: ADR 0380 (decisions 2 and 3: `ai: never` and the code floor); ADR 0341 (decision 2); ADR 0221;
 *                     STA-1251 (the OS search specs' `ai: never` rule, cited there as ADR 0043).
 */
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** The `ai` code of a data class that is never given to a model. */
const AI_NEVER = "never";

/**
 * The `searchable_semantic_ai_never` refusals of `ir`.
 *
 * @param ir - the member read by discovery.
 * @example
 * checkSemanticSearch(ir).map((refusal) => refusal.subject); // ["CaseNote.body"]
 */
export function checkSemanticSearch(ir: MemberIR): GenError[] {
  const models = new Map(
    ir.classes
      .filter((declared) => declared.kind === "model")
      .map((declared) => [declared.name, declared]),
  );
  const shapes = new Map(ir.shapes.map((shape) => [shape.name, shape]));

  /** The `ai` effect of `field` on `model` or an own base model; undefined when no `@Classify` there says one. */
  const aiOf = (model: DeclaredClass, field: string, seen: Set<string>): unknown => {
    if (seen.has(model.name)) return undefined;
    seen.add(model.name);
    const facet = model.facets.find(
      (candidate) =>
        candidate.name === "Classify" && candidate.target === "field" && candidate.member === field,
    );
    if (facet !== undefined)
      return (facet.options as { readonly dataClass?: { readonly ai?: unknown } } | undefined)
        ?.dataClass?.ai;
    const base = model.base?.own === true ? models.get(model.base.name) : undefined;
    return base === undefined ? undefined : aiOf(base, field, seen);
  };

  /** The model and field a text path ends at, following relations to own models; undefined when it leaves them. */
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
    const searchable = model.facets.find(
      (facet) => facet.name === "Searchable" && facet.target === "class",
    );
    const options = searchable?.options as
      | { readonly text?: readonly unknown[]; readonly semantic?: unknown }
      | undefined;
    if (options?.semantic !== true) continue;
    for (const path of options.text ?? []) {
      if (typeof path !== "string") continue;
      const end = endOf(model, path);
      if (end === undefined || aiOf(end.model, end.field, new Set()) !== AI_NEVER) continue;
      errors.push({
        code: "searchable_semantic_ai_never",
        file: model.file,
        line: 0,
        column: 0,
        subject: `${model.name}.${path}`,
        message: `${model.name} is @Searchable({ semantic: true }), which embeds ${path} through a model provider, but its data class says ai: never`,
        fix: `drop ${path} from the facet's text, or drop semantic: true (lexical search never leaves the database)`,
      });
    }
  }
  return errors;
}
