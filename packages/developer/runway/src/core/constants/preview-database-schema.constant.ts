/**
 * Stackra file contract:
 * Purpose: `PREVIEW_DATABASE_SCHEMA`, the preview keys of `environments.preview.shared.database`: where the database
 *          comes from (`from`, default `seed-pack`), the seed profile (`profile`, default `demo`) and, for a branch,
 *          the Neon project and the parent branch it copies (`branch`).
 * Boundary: internal; `previewDatabaseOf` is its only reader. `shared.database` is an open object in the canonical
 *           root schema, so these keys reach here unchecked; every other key passes through. Names only: the Neon API
 *           key is `neonctl`'s own login, never a runway value.
 * Runtime: isomorphic
 * Governing contract: ADR 0238 (decision 1), ADR 0296 (decision 2: the root runway), ADR 0190 (seed-pack profiles).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { PreviewDatabaseSource } from "#core/enums/preview-database-source.enum";

/** The seed-pack profiles `stackra seed-pack --profile` loads (ADR 0190). */
const PROFILES = ["minimal", "demo", "test"] as const;

/** The preview keys of the preview environment's `shared.database`, defaults applied. */
export const PREVIEW_DATABASE_SCHEMA = z
  .looseObject({
    from: z
      .enum(
        Enum.values(PreviewDatabaseSource) as [PreviewDatabaseSource, ...PreviewDatabaseSource[]],
      )
      .default(PreviewDatabaseSource.SeedPack),
    profile: z.enum(PROFILES).default("demo"),
    branch: z
      .strictObject({
        provider: z.literal("neon"),
        project: z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "Expected a Neon project id"),
        parent: z.string().min(1).default("main"),
      })
      .optional(),
  })
  .refine(
    (database) => database.from !== PreviewDatabaseSource.Branch || database.branch !== undefined,
    {
      path: ["branch"],
      message: "Name the Neon project and parent branch a preview branches from",
    },
  );
