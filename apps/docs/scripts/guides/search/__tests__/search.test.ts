/**
 * Stackra file contract:
 * Purpose: the tests of the "Search" guide's examples on PGlite and the memory engine: the migration compiles the
 *          facet's search columns and the GIN index; a published article is found by every word of a phrase, in any
 *          case and without its accents, a category filter narrows the result, a draft is never found, an article
 *          taken back to draft leaves the index, and a page reports whether more follow.
 * Boundary: test only; the database is the memory driver started from the compiled migration, the engine is
 *           `MemorySearchDriver` (the `memory` search driver; the `postgres` one reads the same facet from the columns
 *           the migration writes), and `help.entities.ts` stands in for gen's output.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0221; ADR 0266; STA-2843.
 */
import "./help.entities";

import { MemorySearchDriver, Search } from "@stackra/search";
import { SearchableMacro } from "@stackra/search/node";
import { MemorySettingValueStoreDriver, SettingsReader } from "@stackra/settings";
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";

import { connectGuideDatabase } from "#scripts/guides/support/connect-guide-database";
import type { GuideDatabase } from "#scripts/guides/support/guide-database";
import { CreateArticlesMigration } from "../0001-create-articles.migration";
import { ArticleService } from "../article.service";

let guide: GuideDatabase;

beforeAll(async () => {
  guide = await connectGuideDatabase([
    { schema: "help", migrations: [CreateArticlesMigration], macros: [SearchableMacro] },
  ]);
}, 120_000);

afterAll(async () => {
  await guide.close();
});

describe("Search guide", { timeout: 60_000 }, () => {
  it("compiles the facet's search columns and the full-text index", () => {
    const [create = ""] = Object.values(guide.sql);
    expect(create).toContain('"search_vector" tsvector null');
    expect(create).toContain('"search_text" text null');
    expect(create).toContain('"search_filters" jsonb null');
    expect(create).toContain("idx_articles_search_vector");
    expect(create).toContain("using gin");
  });

  it("finds published articles by phrase and category, and keeps the index in step", async () => {
    const { database } = guide;
    // #region setup
    const search = new Search(
      new MemorySearchDriver(),
      database,
      new SettingsReader(new MemorySettingValueStoreDriver()),
    );
    const articles = new ArticleService(search);
    // #endregion setup

    // #region publish-and-find
    const refund = await database.transaction(() =>
      articles.publish("Getting a refund", "Ask for a refund within 30 days.", "billing"),
    );
    await database.transaction(() =>
      articles.publish("Change your password", "Open settings to reset it.", "account"),
    );
    await database.transaction(async () => {
      articles.create({ title: "Refund policy draft", body: "Not ready.", category: "billing" });
    });

    const found = await articles.lookup("REFUND");
    expect(found.items.map((article) => article.title)).toEqual(["Getting a refund"]);

    const inAccount = await articles.lookup("refund", "account");
    expect(inAccount.items).toEqual([]);
    // #endregion publish-and-find

    // #region unpublish
    await database.transaction(() => articles.unpublish(refund.id));
    expect((await articles.lookup("refund")).items).toEqual([]);
    // #endregion unpublish
  });

  it("folds case and accents, and pages the results", async () => {
    const { database } = guide;
    const search = new Search(
      new MemorySearchDriver(),
      database,
      new SettingsReader(new MemorySettingValueStoreDriver()),
    );
    const articles = new ArticleService(search);
    await database.transaction(async () => {
      for (let n = 1; n <= 12; n += 1)
        await articles.publish(`Café opening hours ${n}`, "When we open.", "venue");
    });

    const first = await articles.lookup("cafe hours");
    expect(first.items).toHaveLength(10);
    expect(first.hasMore).toBe(true);
    const second = await articles.lookup("cafe hours", undefined, first.nextCursor);
    expect(second.items).toHaveLength(2);
    expect(second.hasMore).toBe(false);
  });
});
