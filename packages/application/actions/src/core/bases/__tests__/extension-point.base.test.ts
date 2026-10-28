/**
 * Stackra file contract:
 * Purpose: unit and type tests of `ExtensionPoint`: the bare kind is `extension_point`; `after` and `before` make
 *          branded slots typed from their arguments; an owner calls a slot as a method and, with no extension, gets its
 *          value or its arguments back; a slot called detached is refused.
 * Boundary: test only; slots with extensions are tested in `create-slot.function.test.ts`. The point is the template's
 *           order point.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0305 (rules 22 to 25).
 */
import { kindOf } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ExtensionPoint } from "#core/bases/extension-point.base";
import type { AfterSlot } from "#core/types/after-slot.type";
import type { BeforeSlot } from "#core/types/before-slot.type";
import type { ExtensionContext } from "#core/types/extension-context.type";

interface OrderTotals {
  readonly subtotalMinor: number;
}

interface OrderDraft {
  readonly customerId: string;
}

class OrderExtensionPoint extends ExtensionPoint {
  readonly adjustTotals = ExtensionPoint.after<OrderTotals, [draft: OrderDraft]>();

  readonly verifyPlacement = ExtensionPoint.before<[draft: OrderDraft]>();
}

const ctx: ExtensionContext = {
  callId: "call_1",
  key: "orders.order.create@1",
  actor: { kind: ActorKind.System, id: "sys_1" },
  locale: "en",
  timeZone: "UTC",
  currency: "USD",
  market: "default",
  abortSignal: new AbortController().signal,
  now: () => new Date(0),
};

describe("ExtensionPoint", () => {
  it("is the extension_point kind with branded slots", () => {
    const point = new OrderExtensionPoint();
    expect(kindOf(OrderExtensionPoint)).toEqual({ kind: "extension_point", options: {} });
    expect(point.adjustTotals["~slot"]).toBe("after");
    expect(point.verifyPlacement["~slot"]).toBe("before");
  });

  it("returns the value or the arguments unchanged when no extension is registered", async () => {
    const point = new OrderExtensionPoint();
    const totals = { subtotalMinor: 1000 };
    const draft = { customerId: "usr_1" };
    expect(await point.adjustTotals(totals, draft, ctx)).toBe(totals);
    expect(await point.verifyPlacement(draft, ctx)).toEqual([draft]);
  });

  it("refuses a slot called detached from its point", async () => {
    const { adjustTotals } = new OrderExtensionPoint();
    await expect(adjustTotals({ subtotalMinor: 1 }, { customerId: "usr_1" }, ctx)).rejects.toThrow(
      /method of its point/,
    );
  });

  it("types each slot from its arguments", () => {
    expectTypeOf<OrderExtensionPoint["adjustTotals"]>().toEqualTypeOf<
      AfterSlot<OrderTotals, [draft: OrderDraft]>
    >();
    expectTypeOf<OrderExtensionPoint["verifyPlacement"]>().toEqualTypeOf<
      BeforeSlot<[draft: OrderDraft]>
    >();
    expectTypeOf(
      new OrderExtensionPoint().adjustTotals,
    ).returns.resolves.toEqualTypeOf<OrderTotals>();
    // @ts-expect-error -- the slot's context is required
    void new OrderExtensionPoint().verifyPlacement({ customerId: "usr_1" });
  });
});
