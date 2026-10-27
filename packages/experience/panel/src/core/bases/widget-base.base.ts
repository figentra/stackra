/**
 * Stackra file contract:
 * Purpose: `WidgetBase`, the instance side of a widget: the class `Widget<Query>({ ... })` in `widget.base.ts` hands to `createKind`, so every
 *          `Widget(...)` class extends it.
 * Boundary: the instance base only; the kind brand is type-only. The called form, its option checks and its key live in
 *           `widget.base.ts`; the entry exports this class as a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 14 to 19); ADR 0294 (decisions 16 and 25); ADR 0305 (rules 10 to 13, 43 and 46).
 */
import type { OutputOf } from "@stackra/actions";

import type { Built } from "#core/types/built.type";
import type { Display } from "#core/types/display.type";
import type { DisplayNode } from "#core/types/display-node.type";

/** The instance side every widget shares: the display it presents its query's answer with. */
export abstract class WidgetBase<Q extends object> {
  /** Type-only kind brand, so a class of another kind cannot stand in for a widget. */
  declare protected readonly "~kind": "widget";

  /** Type-only: the query the widget is bound to. */
  declare protected readonly "~query"?: Q;

  /** The display, every path a key of the query's output. */
  abstract display(display: Display<OutputOf<Q>>): Built<DisplayNode>;
}
