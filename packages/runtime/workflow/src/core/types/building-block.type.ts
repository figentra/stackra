/**
 * Stackra file contract:
 * Purpose: `BuildingBlock`, one capability a package exposes to automations and plans: its key, its kind, the event or
 *          action class behind it, its label and, for a trigger, the facts a condition may test and the correlation a
 *          waiting step matches.
 * Boundary: a type only, registered in code with `registerBlocks` (the palette is code, ADR 0270 decision 3). An
 *           automation references a block by key and never carries code. `facts` are `@stackra/rules` fields under the
 *           `trigger` source; `read` turns an occurrence's JSON into those facts (the default reads each field as it
 *           is and a date field's ISO text as a `Date`). `correlate` is a pure function of the occurrence (no clock, no
 *           I/O): with it, every occurrence is held for a waiting run of the same scope and correlation.
 * Runtime: isomorphic
 * Governing contract: ADR 0153 (decision 1); ADR 0122 (decision 3: composed only from registered blocks); ADR 0331
 *                     (decisions 4 and 10); ADR 0152 (decision 1: event waits).
 */
import type { AnyClass } from "@stackra/container";
import type { FactValue } from "@stackra/rules";
import type { FactField } from "@stackra/rules/contracts";

import type { BlockKind } from "#core/enums/block-kind.enum";

/**
 * One building block.
 *
 * @example
 * registerBlocks([
 *   { key: "orders.order_paid", kind: BlockKind.Trigger, type: OrderPaid, label: "orders::blocks.order_paid",
 *     facts: { total: { type: FieldType.Number, label: "orders::facts.total" } }, correlate: (event) => event.orderId },
 *   { key: "notifications.send_sms", kind: BlockKind.Action, type: SendSmsAction, label: "notifications::blocks.sms" },
 * ]);
 */
export interface BuildingBlock {
  /** The block's key: a module key, then dotted snake_case (`orders.order_paid`). */
  readonly key: string;

  /** Trigger or action. */
  readonly kind: BlockKind;

  /** The event class (trigger) or action class (action). */
  readonly type: AnyClass;

  /** The lang key of its name in the automation studio. */
  readonly label: string;

  /** A trigger's fields a step's `when` may test, under the `trigger` source. */
  readonly facts?: Readonly<Record<string, FactField>>;

  /** A trigger's facts from one occurrence's JSON; the default reads each field, a date from its ISO text. */
  readonly read?: (
    payload: Readonly<Record<string, unknown>>,
  ) => Readonly<Record<string, FactValue | null | undefined>>;

  /** A trigger's business key, from one occurrence, which a waiting step's correlation must equal. */
  readonly correlate?: (event: never) => string | object;
}
