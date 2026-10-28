/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Extension`: both forms record the `extension` kind (the called form with `order`
 *          and `input`), keep constructor dependencies, and type `handle` from the slot: an `after` handler returns the
 *          value, a `before` handler returns the arguments; a wrong parameter, a missing type argument in the called
 *          form, a bad order and a non-class input are refused.
 * Boundary: test only; the extensions mirror the template's loyalty extensions on the order point.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0305 (rules 5, 25 and 44); the STA-409 partner spike.
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { Extension } from "#core/bases/extension.base";
import { ExtensionPoint } from "#core/bases/extension-point.base";
import type { ExtensionContext } from "#core/types/extension-context.type";

interface OrderTotals {
  readonly subtotalMinor: number;
  readonly adjustments: readonly number[];
}

interface OrderDraft {
  readonly customerId: string;
}

class OrderExtensionPoint extends ExtensionPoint {
  readonly adjustTotals = ExtensionPoint.after<OrderTotals, [draft: OrderDraft]>();

  readonly verifyPlacement = ExtensionPoint.before<[draft: OrderDraft]>();
}

class RedeemPointsRequest {}

class Loyalty {
  readonly blocked = new Set(["usr_blocked"]);
}

class RedeemPointsExtension extends Extension<OrderExtensionPoint["adjustTotals"]>({
  order: 200,
  input: RedeemPointsRequest,
}) {
  async handle(
    totals: OrderTotals,
    _draft: OrderDraft,
    _ctx: ExtensionContext,
  ): Promise<OrderTotals> {
    return { ...totals, adjustments: [...totals.adjustments, -100] };
  }
}

class VerifyPointsBalanceExtension extends Extension<OrderExtensionPoint["verifyPlacement"]> {
  readonly loyalty: Loyalty;

  constructor(loyalty: Loyalty) {
    super();
    this.loyalty = loyalty;
  }

  async handle(draft: OrderDraft, _ctx: ExtensionContext): Promise<[draft: OrderDraft]> {
    if (this.loyalty.blocked.has(draft.customerId)) throw new Error("insufficient_points");
    return [draft];
  }
}

const ctx = {} as ExtensionContext;

describe("Extension", () => {
  it("records the extension kind in both forms", () => {
    expect(kindOf(RedeemPointsExtension)).toEqual({
      kind: "extension",
      options: { order: 200, input: RedeemPointsRequest },
    });
    expect(kindOf(VerifyPointsBalanceExtension)).toEqual({ kind: "extension", options: {} });
  });

  it("runs handle with its dependencies", async () => {
    const verify = new VerifyPointsBalanceExtension(new Loyalty());
    expect(verify).toBeInstanceOf(Extension);
    expect(await verify.handle({ customerId: "usr_1" }, ctx)).toEqual([{ customerId: "usr_1" }]);
    await expect(verify.handle({ customerId: "usr_blocked" }, ctx)).rejects.toThrow(
      "insufficient_points",
    );
    const totals = await new RedeemPointsExtension().handle(
      { subtotalMinor: 1000, adjustments: [] },
      {
        customerId: "usr_1",
      },
      ctx,
    );
    expect(totals.adjustments).toEqual([-100]);
  });

  it("refuses a bad order or input", () => {
    expect(() => Extension<OrderExtensionPoint["adjustTotals"]>({ order: 1.5 })).toThrow(
      RangeError,
    );
    expect(() =>
      Extension<OrderExtensionPoint["adjustTotals"]>({
        input: "loyalty" as unknown as typeof RedeemPointsRequest,
      }),
    ).toThrow(TypeError);
  });

  it("types handle from the slot", () => {
    class WrongValue extends Extension<OrderExtensionPoint["adjustTotals"]> {
      // @ts-expect-error -- an after handler returns the slot's value type
      async handle(
        _totals: OrderTotals,
        _draft: OrderDraft,
        _ctx: ExtensionContext,
      ): Promise<string> {
        return "wrong";
      }
    }
    // @ts-expect-error -- the called form needs the slot as a type argument
    const Untyped = Extension({ order: 1 });
    expect([WrongValue, Untyped]).toHaveLength(2);
  });
});
