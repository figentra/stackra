/**
 * Stackra file contract:
 * Purpose: `ArticleService`, the example service of the "Search" guide: it writes articles and keeps their search
 *          documents in step in the same transaction (a published article is indexed, an unpublished one leaves the
 *          index), and finds articles by phrase, optionally within one category, one page at a time.
 * Boundary: runs inside the caller's transaction; `Search` is the injected reader over the configured engine
 *           (`postgres` in a deployment, `memory` in tests). Rows come back loaded through the ORM, so a row the
 *           session cannot read is never returned.
 * Runtime: node
 * Governing contract: ADR 0221; ADR 0105 as amended by ADR 0294; STA-2843.
 */
import { CrudService } from "@stackra/database";
import type { Search } from "@stackra/search";

import { Article } from "./article.model";
import type { ArticlePage } from "./article-page";

/** The help centre's articles. */
export class ArticleService extends CrudService<Article> {
  /** The search reader. */
  private readonly search: Search;

  /**
   * @param search - finds and indexes articles.
   */
  constructor(search: Search) {
    super();
    this.search = search;
  }

  /** Writes a published article and indexes it in the same transaction. */
  async publish(title: string, body: string, category: string): Promise<Article> {
    const article = await this.insert({ title, body, category, status: "published" });
    await this.search.in(Article).index([article]);
    return article;
  }

  /** Takes an article back to draft; indexing it again removes its document, as `when` asks. */
  async unpublish(id: Article["id"]): Promise<Article> {
    const article = await this.update({ id }, { status: "draft" });
    await this.search.in(Article).index([article]);
    return article;
  }

  /** The published articles matching every word of `phrase`, within `category` when given. */
  async lookup(phrase: string, category?: string, cursor?: string): Promise<ArticlePage> {
    return this.search.in(Article).page(phrase, {
      filters: category === undefined ? {} : { category },
      cursor,
      limit: 10,
    });
  }
}
