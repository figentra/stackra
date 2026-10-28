/**
 * Stackra file contract:
 * Purpose: `Blocks`, the data constructors of a document's blocks: a query table, a widget tile and a registered block
 *          with its props.
 * Boundary: pure: each returns a frozen `PanelBlockNode` that names registered code, never markup or an expression
 *           (ADR 0154). `table` is checked against the query's input and row, `custom` against the block's props
 *           (`@stackra/experience`'s `BlockProps`).
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 20); ADR 0110; ADR 0154; ADR 0270 (decision 3: the palette is code, panel `Blocks.*`);
 *                     STA-1383 (renamed from BlockNode, experience's renderer component).
 */
import type { AnyClass } from "@stackra/container";
import type { BlockClass, BlockProps } from "@stackra/experience";

import type { WidgetSize } from "#core/enums/widget-size.enum";
import type { PanelBlockNode } from "#core/types/panel-block-node.type";
import type { Path } from "#core/types/path.type";
import type { QueryInput } from "#core/types/query-input.type";
import type { QueryRow } from "#core/types/query-row.type";

/**
 * Builds the block nodes a document page lays out.
 *
 * @example
 * Blocks.table(ListOrdersQuery, { params: { limit: 20 }, columns: ["id", "status", "createdAt"] });
 * Blocks.widget(AwaitingPaymentWidget, { size: WidgetSize.Full });
 * Blocks.custom(WelcomeHeroBlock, { titleKey: I18n.documents.welcome.hero.title });
 */
export const Blocks = Object.freeze({
  /** A table over the list query `query` (Page documents only). */
  table: <Q extends AnyClass>(
    query: Q,
    options: {
      readonly params?: { readonly [K in keyof QueryInput<Q>]?: QueryInput<Q>[K] };
      readonly columns: readonly Path<QueryRow<Q>>[];
    },
  ): PanelBlockNode =>
    Object.freeze({
      kind: "table",
      query,
      columns: Object.freeze([...options.columns]),
      ...(options.params === undefined ? {} : { params: Object.freeze({ ...options.params }) }),
    }),

  /** The widget `widget` as a tile. */
  widget: (widget: AnyClass, options: { readonly size?: WidgetSize } = {}): PanelBlockNode =>
    Object.freeze({ kind: "widget", widget, ...options }),

  /** The registered block `block` with its props; the data of a block that accepts a query is fetched at render. */
  custom: <B extends BlockClass>(block: B, props: Omit<BlockProps<B>, "data">): PanelBlockNode =>
    Object.freeze({
      kind: "custom",
      block,
      props: Object.freeze({ ...(props as Readonly<Record<string, unknown>>) }),
    }),
});
