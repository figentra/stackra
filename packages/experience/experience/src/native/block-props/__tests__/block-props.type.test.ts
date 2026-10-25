/**
 * Stackra file contract:
 * Purpose: type tests of the native `BlockProps`: the `.` entry's props plus a required `onEvent` that takes the
 *          block's own event schemas, as the template's mobile promo banner uses it.
 * Boundary: test only; compile-time assertions through `expectTypeOf`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0305 (rules 12 and 37); ADR 0110 (decision 3).
 */
import { describe, expectTypeOf, it } from "@stackra/testing";
import { Schema } from "@stackra/validation";

import type { BlockEvent } from "#contracts/types/block-event.type";
import { Block } from "#core/bases/block.base";
import { BlockCategory } from "#core/enums/block-category.enum";
import type { BlockProps as CoreBlockProps } from "#core/types/block-props.type";
import type { BlockProps } from "#native/block-props/block-props.type";

class NavigateEvent extends Schema {
  verb!: "navigate";

  route!: string;
}

class ActionEvent extends Schema {
  verb!: "action";

  key!: string;
}

class PromoBannerCta extends Schema {
  label!: string;

  event!: NavigateEvent | ActionEvent;
}

class PromoBannerBlock extends Block({ category: BlockCategory.Marketing, icon: "megaphone" }) {
  headline!: string;

  body?: string;

  cta?: PromoBannerCta;
}

describe("BlockProps (native)", () => {
  it("adds a required onEvent that takes the block's own events", () => {
    type Props = BlockProps<typeof PromoBannerBlock>;
    expectTypeOf<Props>().toMatchTypeOf<CoreBlockProps<typeof PromoBannerBlock>>();
    expectTypeOf<Props["onEvent"]>().toEqualTypeOf<(event: BlockEvent) => void>();
    expectTypeOf<NonNullable<Props["cta"]>["event"]>().toMatchTypeOf<BlockEvent>();
    expectTypeOf<Props["headline"]>().toEqualTypeOf<string>();
  });
});
