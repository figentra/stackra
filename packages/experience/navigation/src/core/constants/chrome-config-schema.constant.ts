/**
 * Stackra file contract:
 * Purpose: `ChromeConfig$`, the zod schema of the chrome options: the package's shipped `X$`, which `buildConfig`
 *          validates `ChromeConfig` (and an app's override) with, and which a member's generated schemas reuse
 *          through `ChromeConfig$.extend({ header: ChromeConfig$.shape.header.unwrap().default(...) })`.
 * Boundary: mirrors `ChromeOptions` field for field, each object with its own default so `shape.header.parse(undefined)`
 *           gives the defaults. `zod` is imported here only because gen does not yet compile this package's schemas.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0095 as amended; registry v3.1 section 5 item 3 (a package's shipped
 *                     `X$`).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { BackTitle } from "#core/enums/back-title.enum";
import { HeaderStyle } from "#core/enums/header-style.enum";

// shortcut: authored until gen compiles this package's ChromeOptions into #stackra/schemas; replace it with STA-339.
/** The schema of `ChromeOptions`, with its defaults; extendable by a member's generated override schema. */
export const ChromeConfig$ = z.object({
  header: z
    .object({
      style: z.enum(Enum.values(HeaderStyle)).default(HeaderStyle.Default),
      blur: z.boolean().default(false),
      backTitle: z.enum(Enum.values(BackTitle)).default(BackTitle.Default),
    })
    .default(() => ({ style: HeaderStyle.Default, blur: false, backTitle: BackTitle.Default })),
  tabBar: z
    .object({
      minimizeOnScroll: z.boolean().default(false),
      sidebarAdaptable: z.boolean().default(false),
    })
    .default(() => ({ minimizeOnScroll: false, sidebarAdaptable: false })),
});
