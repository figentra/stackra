/**
 * Stackra file contract:
 * Purpose: `ChromeOptions`, the options shape of `ChromeConfig`: the native header every screen starts from and the
 *          tab bar's behaviour.
 * Boundary: a shape class: fields, types and defaults only. The defaults are the platform's own look (a standard bar,
 *           the previous title on the back button, a fixed tab bar); an app turns on glass and minimising in its
 *           `ChromeConfig` override.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 34: `Config({ schema })`); ADR 0165 (React Navigation on mobile); ADR 0294
 *                     (decision 6: the `@Field(zod)` hatch).
 */
import { Enum } from "@stackra/contracts";
import { Field, Schema } from "@stackra/validation";
import { z } from "zod";

import { BackTitle } from "#core/enums/back-title.enum";
import { HeaderStyle } from "#core/enums/header-style.enum";
import type { ChromeHeader } from "#core/types/chrome-header.type";
import type { ChromeTabBar } from "#core/types/chrome-tab-bar.type";

/** The options of `ChromeConfig`. */
export class ChromeOptions extends Schema {
  /** The default native header. */
  // reason: `ChromeHeader` is an interface that ships no `X$`; its zod says the same three fields
  @Field(
    z.object({
      style: z.enum(Enum.values(HeaderStyle)),
      blur: z.boolean(),
      backTitle: z.enum(Enum.values(BackTitle)),
    }),
  )
  header: ChromeHeader = {
    style: HeaderStyle.Default,
    blur: false,
    backTitle: BackTitle.Default,
  };

  /** The tab bar's behaviour. */
  // reason: `ChromeTabBar` is an interface that ships no `X$`; its zod says the same two fields
  @Field(z.object({ minimizeOnScroll: z.boolean(), sidebarAdaptable: z.boolean() }))
  tabBar: ChromeTabBar = { minimizeOnScroll: false, sidebarAdaptable: false };
}
