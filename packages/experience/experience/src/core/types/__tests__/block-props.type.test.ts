/**
 * Stackra file contract:
 * Purpose: type tests of `BlockProps`: every `LocalizedText` reads as `string` (also nested and in lists), a branded
 *          string and a fixed-key shape of strings keep their types, optional props stay optional, and `data` is the
 *          accepted query's output, absent for a block that accepts none.
 * Boundary: test only; compile-time assertions through `expectTypeOf`, mirroring the template's console and web blocks.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0305 (rules 12 and 37); ADR 0110 (decision 2).
 */
import { queryRef } from "@stackra/clients";
import type { Branded } from "@stackra/contracts";
import { describe, expectTypeOf, it } from "@stackra/testing";
import { Schema } from "@stackra/validation";
import { z } from "zod";

import { Block } from "#core/bases/block.base";
import { BlockCategory } from "#core/enums/block-category.enum";
import type { BlockProps } from "#core/types/block-props.type";
import type { LocalizedText } from "#core/types/localized-text.type";

/** A stand-in for `@stackra/i18n`'s branded `I18nKey`. */
type I18nKey = Branded<string, "i18n.I18nKey">;

class ListPlansQuery extends queryRef("billing.catalog.plan.list@1", {
  input: z.object({ product: z.string() }),
  output: z.object({ plans: z.array(z.object({ id: z.string() })) }),
}) {}

class CallToAction extends Schema {
  label!: LocalizedText;

  route!: string;
}

class NavigateEvent extends Schema {
  verb!: "navigate";

  route!: string;
}

class FeatureGridBlock extends Block({ category: BlockCategory.Marketing, icon: "layout-grid" }) {
  title!: LocalizedText;

  titleKey!: I18nKey;

  cta?: CallToAction;

  features!: { title: LocalizedText }[];

  event!: NavigateEvent;
}

class PricingTableBlock extends Block({
  category: BlockCategory.Commerce,
  icon: "receipt",
  accepts: ListPlansQuery,
}) {
  product!: string;
}

describe("BlockProps", () => {
  it("reads LocalizedText as the visitor's string and keeps every other type", () => {
    type Props = BlockProps<typeof FeatureGridBlock>;
    expectTypeOf<Props["title"]>().toEqualTypeOf<string>();
    expectTypeOf<Props["titleKey"]>().toEqualTypeOf<I18nKey>();
    expectTypeOf<NonNullable<Props["cta"]>>().toEqualTypeOf<{
      readonly label: string;
      readonly route: string;
    }>();
    expectTypeOf<Props["features"]>().toEqualTypeOf<readonly { readonly title: string }[]>();
    expectTypeOf<Props["event"]>().toEqualTypeOf<{
      readonly verb: "navigate";
      readonly route: string;
    }>();
    expectTypeOf<Props>().not.toHaveProperty("data");
  });

  it("adds data typed by the accepted query", () => {
    type Props = BlockProps<typeof PricingTableBlock>;
    expectTypeOf<Props["product"]>().toEqualTypeOf<string>();
    expectTypeOf<Props["data"]>().toEqualTypeOf<{ plans: { id: string }[] }>();
  });
});
