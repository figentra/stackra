/**
 * Stackra file contract:
 * Purpose: unit tests of `Blocks`: table, widget and custom block nodes that name classes, frozen.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 20); ADR 0154.
 */
import { describe, expect, it } from "@stackra/testing";

import { Blocks } from "#core/constants/blocks.constant";
import { WidgetSize } from "#core/enums/widget-size.enum";

class ListOrdersQuery {
  async handle(_input: {
    readonly limit: number;
  }): Promise<{ items: { id: string; status: string }[] }> {
    return { items: [] };
  }
}
class KpisWidget {}
class HeroBlock {}

describe("Blocks", () => {
  it("builds frozen block nodes", () => {
    const table = Blocks.table(ListOrdersQuery, {
      params: { limit: 20 },
      columns: ["id", "status"],
    });
    expect(table).toEqual({
      kind: "table",
      query: ListOrdersQuery,
      params: { limit: 20 },
      columns: ["id", "status"],
    });
    expect(Blocks.widget(KpisWidget, { size: WidgetSize.Full })).toEqual({
      kind: "widget",
      widget: KpisWidget,
      size: "full",
    });
    expect(
      Blocks.custom(HeroBlock as never, { title: "documents::welcome.title" } as never),
    ).toEqual({
      kind: "custom",
      block: HeroBlock,
      props: { title: "documents::welcome.title" },
    });
    expect(Object.isFrozen(table)).toBe(true);
  });
});
