/**
 * Stackra file contract:
 * Purpose: `Article`, the example model of the "Search" guide: a help-centre article, one row of `help.articles` (key
 *          `help.article`, public ids `art_…`). `@Searchable` declares its index: the words of the title and body, the
 *          category as an exact filter, and only published articles.
 * Boundary: data only, as an app's `src/modules/help/models/article.model.ts` would hold it; the facet records
 *           metadata, which gen checks and @stackra/search reads.
 * Runtime: node
 * Governing contract: ADR 0221 (hybrid search over a model's facet); ADR 0294; STA-2843.
 */
import { HasPublicId, Model, Searchable, Timestamps } from "@stackra/model";
import { Str } from "@stackra/validation";

/** A help-centre article; only a published one can be found. */
@Searchable({
  text: ["title", "body"],
  filters: ["category"],
  when: { status: ["published"] },
})
export class Article extends Model.with(HasPublicId("art"), Timestamps) {
  /** The headline; its words weigh most, being the first text field. */
  @Str({ max: 200 })
  title!: string;

  /** The article itself. */
  @Str({ max: 20_000 })
  body!: string;

  /** Where it is filed (`billing`, `account`). */
  @Str({ max: 40 })
  category!: string;

  /** `draft` until it is published. */
  status = "draft";
}
