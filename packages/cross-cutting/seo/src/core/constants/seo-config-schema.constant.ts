/**
 * Stackra file contract:
 * Purpose: `SeoConfig$`, the zod schema of the SEO options: the package's shipped `X$`, which `buildConfig` validates
 *          `SeoConfig` (and a member's override) with, and which a member's generated schemas reuse through
 *          `SeoConfig$.extend(...)` instead of recompiling.
 * Boundary: mirrors `SeoOptions` field for field, with field rules only and every field defaulted, so `.parse({})`
 *           gives the defaults and gen's override schema can `.extend` it. A robots user agent is one token and every
 *           robots path starts with `/` and holds no line break, so a configured value cannot add a directive.
 *           `zod` is imported here only because gen does not yet compile this package's schemas.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0301 (decisions 2 and 3); registry v3.1 section 5 item 3.
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { OgKind } from "#core/enums/og-kind.enum";

/** A robots path: rooted, one line. */
const ROBOTS_PATH = z
  .string()
  .startsWith("/")
  .max(2048)
  .regex(/^[^\r\n]*$/);

/** A positive whole number of pixels within what an Open Graph card needs. */
const PIXELS = z.int().min(200).max(4096);

// shortcut: authored until gen compiles this package's SeoOptions into #stackra/schemas; replace it with STA-339.
/** The schema of `SeoOptions`, with its defaults; extendable by a member's generated override schema. */
export const SeoConfig$ = z.object({
  titleTemplate: z.string().min(2).max(200).includes("%s").default("%s"),
  robots: z
    .record(
      z.string().regex(/^[A-Za-z0-9*._-]{1,128}$/),
      z.object({ allow: z.array(ROBOTS_PATH), disallow: z.array(ROBOTS_PATH) }),
    )
    .default(() => ({ "*": { allow: ["/"], disallow: [] } })),
  sitemapPageSize: z.int().min(1).max(50_000).default(10_000),
  noindexParams: z.array(z.string().min(1).max(128)).default(() => []),
  consumedSitemaps: z.boolean().default(false),
  og: z
    .object({
      kinds: z.array(z.enum(Enum.values(OgKind))).min(1),
      width: PIXELS,
      height: PIXELS,
      cacheSeconds: z.int().min(0).max(31_536_000),
    })
    .default(() => ({
      kinds: Enum.values(OgKind),
      width: 1200,
      height: 630,
      cacheSeconds: 86_400,
    })),
  hreflang: z.boolean().default(true),
  jsonLd: z.boolean().default(true),
});
