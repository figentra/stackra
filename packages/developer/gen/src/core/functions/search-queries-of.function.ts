/**
 * Stackra file contract:
 * Purpose: `searchQueriesOf`, the search query gen writes for each own `@Searchable` model (`Search<Model>Query`, key
 *          `<model>.search`, in `#stackra/search`), as a declared query beside its model, so the manifest, the endpoint
 *          convention, the MCP tool and the wiring treat it like an authored query (ADR 0221 d6, STA-1459).
 * Boundary: pure; reads `ir.classes`. Empty when the member does not declare `@stackra/search`. A member class already
 *           named `Search<Model>Query` (a hand-written public search) takes the generated one's place, so that model
 *           is skipped. The key, actors and constructor tokens mirror `SearchQuery(Model)` of `@stackra/search/node`;
 *           its input and output are that package's `SearchQueryInput` and `SearchQueryOutput`, whose JSON Schemas the
 *           manifest writes from `GENERATED_QUERY_SCHEMAS`.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decisions 4 and 6); ADR 0294 (decisions 16, 20 and 21); ADR 0155 (queries are MCP tools).
 */
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** The callers `SearchQuery` defaults to: a user, an agent and a service. */
const ACTORS: readonly string[] = ["user", "agent", "service"];

/**
 * Each searchable model of `ir` with the search query gen writes for it.
 *
 * @param ir - the member read by discovery.
 * @returns the models in class order, each with its generated query as a declared class.
 * @example
 * searchQueriesOf(ir)[0]?.query.options["key"]; // "product.search"
 */
export function searchQueriesOf(
  ir: MemberIR,
): readonly { readonly model: DeclaredClass; readonly query: DeclaredClass }[] {
  if (ir.packages !== undefined && !ir.packages.includes("@stackra/search")) return [];
  const authored = new Set(ir.classes.map((declared) => declared.name));
  return ir.classes
    .filter(
      (declared) =>
        declared.kind === "model" &&
        declared.facets.some((facet) => facet.name === "Searchable" && facet.target === "class") &&
        !authored.has(`Search${declared.name}Query`),
    )
    .map((model) => ({
      model,
      query: {
        name: `Search${model.name}Query`,
        kind: "query",
        module: model.module,
        file: ".stackra/gen/search.ts",
        importPath: "#stackra/search",
        // The same snake case `SearchQuery` derives its key with, so the locked key matches run time.
        options: {
          key: `${model.name.replaceAll(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase()}.search`,
          actors: ACTORS,
        },
        deps: [
          { class: { name: "Search", from: "@stackra/search" } },
          { class: { name: "Database", from: "@stackra/database" } },
        ],
        facets: [],
        methods: ["handle"],
        handle: { input: "SearchQueryInput", output: "SearchQueryOutput" },
        refusals: [],
        statics: {},
        traits: [],
      },
    }));
}
