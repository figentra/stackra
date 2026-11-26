/**
 * Stackra file contract:
 * Purpose: the migration of the "Search" guide's `help` module: the `articles` table with the search columns
 *          `t.searchable(...)` (the macro of `@stackra/search/node`) writes for the facet, and the GIN index the
 *          full-text lane reads.
 * Boundary: a frozen snapshot that uses only `@stackra/database` and the search macro; every name is a literal. The
 *           index is created inline because the table is new; on an existing table it is `concurrently()`.
 * Runtime: node
 * Governing contract: ADR 0159; ADR 0221 (the index lives in the model's own table); ADR 0160; STA-2843.
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the articles table with its search columns. */
export class CreateArticlesMigration extends Migration {
  /** The table, the facet's columns and the full-text index. */
  up(schema: SchemaBuilder): void {
    schema.create("articles", (t: Blueprint) => {
      t.hasPublicId("art");
      t.timestamps();
      t.string("title", 200).notNull().comment("The article's headline.");
      t.string("body", 20_000).notNull().comment("The article itself.");
      t.string("category", 40).notNull().comment("Where the article is filed.");
      t.string("status", 20).notNull().default("draft").comment("draft or published.");
      t.searchable({ text: ["title", "body"], filters: ["category"] });
      t.index(["search_vector"]).using("gin");
    });
  }
}
