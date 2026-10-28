/**
 * Stackra file contract:
 * Purpose: `PanelBlockNode`, one block of a document: a query table (Page only), a widget, or a registered block with its props.
 * Boundary: a type only; built by `Blocks.*`. A document only references registered code, so a block names a class,
 *           never markup or an expression.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 20: a Dashboard places widget classes only); ADR 0110; ADR 0154; ADR 0270 (decision 3);
 *                     STA-1383 (renamed from BlockNode, experience's renderer component).
 */
import type { AnyClass } from "@stackra/container";

import type { WidgetSize } from "#core/enums/widget-size.enum";

/** One document block. */
export type PanelBlockNode =
  | {
      /** A table over a list query (Page documents only). */
      readonly kind: "table";
      /** The list query. */
      readonly query: AnyClass;
      /** The query's input. */
      readonly params?: Readonly<Record<string, unknown>>;
      /** The row paths shown as columns. */
      readonly columns: readonly string[];
    }
  | {
      /** A widget class, as a tile. */
      readonly kind: "widget";
      /** The widget class or its generated client class. */
      readonly widget: AnyClass;
      /** The width, when it differs from the widget's own. */
      readonly size?: WidgetSize;
    }
  | {
      /** A registered block with its props. */
      readonly kind: "custom";
      /** The block class. */
      readonly block: AnyClass;
      /** Its props: typed i18n keys, route keys and values, never markup. */
      readonly props: Readonly<Record<string, unknown>>;
    };
