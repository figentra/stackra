/**
 * Stackra file contract:
 * Purpose: `ScopeConfig$`, the zod schema of the scope options: the package's shipped `X$`, which `buildConfig`
 *          validates `ScopeConfig` (and a deployment's override) with, and which a member's generated schemas reuse
 *          through `ScopeConfig$.extend(...)` instead of recompiling.
 * Boundary: mirrors `ScopeOptions` field for field, with field rules only and every field defaulted, so `.parse({})`
 *           gives the defaults and gen's override schema can `.extend` it (no object-level refinement). A level key is
 *           snake_case and appears once; the root is one path label; an alias is a lang key. The defaults name no
 *           level another package contributes: tenancy adds its level as data (ADR 0323 d4, R-59). `zod` is imported
 *           here only because gen does not yet compile this package's schemas.
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decisions 2 and 4); ADR 0294 (decision 26); ADR 0301 (decisions 2 and 3).
 */
import { z } from "zod";

/** A level key: snake_case, as stored on a node. */
const LEVEL_KEY = /^[a-z][a-z0-9_]{0,62}$/;

/** A lang key: `<module>::<path>`. */
const LANG_KEY = /^[a-z][a-z0-9-]*::[A-Za-z0-9_.-]+$/;

// shortcut: authored until gen compiles this package's ScopeOptions into #stackra/schemas; replace it with STA-339.
/** The schema of `ScopeOptions`, with its defaults; extendable by a member's generated override schema. */
export const ScopeConfig$ = z.object({
  levels: z
    .array(z.object({ key: z.string().regex(LEVEL_KEY), recursive: z.boolean() }))
    .min(1)
    .refine(
      (levels) => new Set(levels.map((level) => level.key)).size === levels.length,
      "each level key once",
    )
    .default(() => [
      { key: "platform", recursive: false },
      { key: "product", recursive: false },
    ]),
  root: z
    .string()
    .regex(/^[a-z0-9_]{1,63}$/, "one path label")
    .default("platform"),
  aliases: z.record(z.string().regex(LEVEL_KEY), z.string().regex(LANG_KEY)).default(() => ({})),
});
