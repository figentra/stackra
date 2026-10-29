/**
 * Stackra file contract:
 * Purpose: `emitSearchQueries`, the `#stackra/search` file (`.stackra/gen/search.ts`): one generated query class per
 *          own `@Searchable` model of the member, `Search<Model>Query extends SearchQuery(<Model>)` (key
 *          `<model>.search`), the one search API the Cmd+K palette and public search widgets read (ADR 0221 d6).
 * Boundary: pure; reads `ir.classes`. Undefined when the member has no own `@Searchable` model, or does not declare
 *           `@stackra/search`. A member class already named `Search<Model>Query` (a hand-written public search) takes
 *           the generated one's place, so that model is skipped (`searchQueriesOf`, which also declares the
 *           queries `generateMember` registers like authored ones, STA-1459).
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decisions 4 and 6); ADR 0294 (decisions 16 and 21); ADR 0155 (queries are MCP tools).
 */
import { generatedHeader } from "#core/functions/generated-header.function";
import { importLines } from "#core/functions/import-lines.function";
import { searchQueriesOf } from "#core/functions/search-queries-of.function";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The `#stackra/search` file of `ir`, or undefined when there is nothing to write.
 *
 * @param ir - the member read by discovery.
 * @example
 * emitSearchQueries(ir); // '... export class SearchProductQuery extends SearchQuery(Product) {}'
 */
export function emitSearchQueries(ir: MemberIR): string | undefined {
  const models = searchQueriesOf(ir).map((pair) => pair.model);
  if (models.length === 0) return undefined;
  const imports = new Map<string, Map<string, boolean>>([
    ["@stackra/search/node", new Map([["SearchQuery", false]])],
  ]);
  for (const model of models)
    imports.set(
      model.importPath,
      (imports.get(model.importPath) ?? new Map<string, boolean>()).set(model.name, false),
    );
  const classes = models.map((model) =>
    [
      `/** The generated search query of \`${model.module}\`'s ${model.name}: key, title and snippet per hit. */`,
      `export class Search${model.name}Query extends SearchQuery(${model.name}) {}`,
    ].join("\n"),
  );
  return [
    generatedHeader({
      from: "the `@Searchable` models",
      purpose: `one search query per searchable model of ${ir.package}, keyed \`<model>.search\`, over its own index.`,
      boundary:
        "reached as `#stackra/search`; `SearchQuery` reads through `Search.in(model)`, so row-level security and " +
        "record visibility apply. Write `Search<Model>Query` by hand to replace one, then run `stackra gen`.",
      runtime: "node",
    }),
    ...importLines(imports),
    "",
    classes.join("\n\n"),
    "",
  ].join("\n");
}
