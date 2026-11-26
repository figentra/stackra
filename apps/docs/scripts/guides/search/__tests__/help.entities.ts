/**
 * Stackra file contract:
 * Purpose: the stand-in for what `stackra gen` writes for the guide's `help` module in an app: the `Article` entity
 *          metadata (`.stackra/gen/entities/help.ts`, in gen's shape) and the `ArticleService` partner registration
 *          (the generated test setup).
 * Boundary: test support only; loading it registers the entity and the partner. The search columns are the
 *           migration's and the engine's, never the model's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0294 (decision 15); ADR 0305; STA-2843.
 */
import {
  EntitySchema,
  type OptionalProps,
  registerEntities,
  registerModelPartners,
} from "@stackra/database";

import { Article } from "../article.model";
import { ArticleService } from "../article.service";

declare module "../article.model" {
  interface Article {
    [OptionalProps]?: "createdAt" | "id" | "status" | "updatedAt";
  }
}

/** `help.article` (article.model.ts). */
export const ArticleSchema = new EntitySchema<Article>({
  class: Article,
  schema: "help",
  tableName: "articles",
  properties: {
    title: { type: "string" },
    body: { type: "string" },
    category: { type: "string" },
    status: { type: "string", default: "draft" },
    id: { type: "string", primary: true },
    createdAt: { type: "datetime" },
    updatedAt: { type: "datetime", onUpdate: () => new Date() },
  },
});

registerEntities([ArticleSchema]);
registerModelPartners([[ArticleService, Article]]);
