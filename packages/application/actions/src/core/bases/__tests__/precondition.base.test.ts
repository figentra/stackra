/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Precondition`: the bare kind is registered as `precondition`, a subclass gets its
 *          constructor dependencies and refuses by throwing from `check`, and `check` must be implemented.
 * Boundary: test only; the precondition is the template's accepting-orders check.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 16 and 23).
 */
import { kindOf } from "@stackra/container";
import { ErrorKind, Refusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { Precondition } from "#core/bases/precondition.base";
import type { PreconditionContext } from "#core/types/precondition-context.type";

class OrdersPausedError extends Refusal({ kind: ErrorKind.FailedPrecondition }) {}

class Settings {
  acceptingOrders = true;
}

class AcceptingOrdersPrecondition extends Precondition {
  readonly settings: Settings;

  constructor(settings: Settings) {
    super();
    this.settings = settings;
  }

  async check(_ctx: PreconditionContext): Promise<void> {
    if (!this.settings.acceptingOrders) throw OrdersPausedError.create();
  }
}

describe("Precondition", () => {
  it("is the precondition kind", () => {
    expect(kindOf(AcceptingOrdersPrecondition)).toEqual({ kind: "precondition", options: {} });
  });

  it("checks with its dependencies and refuses by throwing", async () => {
    const settings = new Settings();
    const precondition = new AcceptingOrdersPrecondition(settings);
    const ctx = {} as PreconditionContext;
    expect(precondition).toBeInstanceOf(Precondition);
    await expect(precondition.check(ctx)).resolves.toBeUndefined();
    settings.acceptingOrders = false;
    await expect(precondition.check(ctx)).rejects.toBeInstanceOf(OrdersPausedError);
  });

  it("makes a subclass implement check", () => {
    // @ts-expect-error -- check is abstract and not implemented
    class Empty extends Precondition {}
    expect(Empty).toBeTypeOf("function");
  });
});
