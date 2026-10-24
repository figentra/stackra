/**
 * Stackra file contract:
 * Purpose: unit tests of `createKind`, the kind-base spike suite ported: both forms construct, `instanceof` holds
 *          against the kind, statics inherit through either form, each call makes its own class, options are recorded
 *          (custom readers included), constructor injection runs through `super()`, and field initializers survive
 *          under `useDefineForClassFields` because the base assigns nothing.
 * Boundary: test only; the kinds here are test-local, cast to their declared types as a kind package does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 25);
 *                     ADR 0305 (rules 2 and 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { createKind } from "#core/functions/create-kind.function";
import { kindOf } from "#core/functions/kind-of.function";

/** A test kind with a static, usable bare and called. */
abstract class SignalBase {
  declare readonly "~kind": "signal";

  /** Builds an instance with the given fields assigned after construction. */
  static create<T extends SignalBase>(this: new () => T, data: Partial<T>): T {
    return Object.assign(new this(), data);
  }
}

type SignalClass = typeof SignalBase;

const Signal = createKind("signal", SignalBase) as SignalClass &
  ((options: { readonly holdFor: string }) => SignalClass);

/** A test kind usable called only, whose reader takes two arguments. */
abstract class ActionBase {
  declare readonly "~kind": "action";

  abstract handle(): string;
}

const Action = createKind("action", ActionBase, (key: string, tool = false) => ({
  key,
  tool,
})) as unknown as (key: string, tool?: boolean) => abstract new () => ActionBase;

class ParcelsCollected extends Signal {
  scannedBy = "";
}

class PaymentCaptured extends Signal({ holdFor: "24h" }) {
  paymentId = "";
}

class Greeting {
  readonly text = "hello";
}

class GreetAction extends Action("greeting.send", true) {
  private readonly greeting: Greeting;

  constructor(greeting: Greeting) {
    super();
    this.greeting = greeting;
  }

  handle(): string {
    return this.greeting.text;
  }
}

describe("createKind", () => {
  it("constructs both forms, which stay instances of the kind", () => {
    expect(ParcelsCollected.create({ scannedBy: "usr_1" })).toBeInstanceOf(Signal);
    expect(PaymentCaptured.create({ paymentId: "pay_1" })).toBeInstanceOf(Signal);
    expect(new GreetAction(new Greeting())).toBeInstanceOf(Action);
    expect(new GreetAction(new Greeting())).toBeInstanceOf(ActionBase);
  });

  it("inherits statics through both forms", () => {
    expect(ParcelsCollected.create).toBe(SignalBase.create);
    expect(PaymentCaptured.create).toBe(SignalBase.create);
    expect(PaymentCaptured.create({ paymentId: "pay_1" }).paymentId).toBe("pay_1");
  });

  it("records the kind, and the options the reader takes from a call", () => {
    expect(kindOf(Signal)).toEqual({ kind: "signal", options: {} });
    expect(kindOf(ParcelsCollected)).toEqual({ kind: "signal", options: {} });
    expect(kindOf(PaymentCaptured)).toEqual({ kind: "signal", options: { holdFor: "24h" } });
    expect(kindOf(GreetAction)).toEqual({
      kind: "action",
      options: { key: "greeting.send", tool: true },
    });
  });

  it("makes a fresh class on every call, and names the kind after its base", () => {
    expect(Signal({ holdFor: "1h" })).not.toBe(Signal({ holdFor: "1h" }));
    expect(Object.getPrototypeOf(ParcelsCollected)).toBe(Signal);
    expect(Signal.name).toBe("Signal");
    expect(Action.name).toBe("Action");
  });

  it("injects through the constructor, with super() first", () => {
    expect(new GreetAction(new Greeting()).handle()).toBe("hello");
  });

  it("keeps subclass field initializers, because the base assigns nothing", () => {
    expect(new ParcelsCollected().scannedBy).toBe("");
    expect(Object.keys(new PaymentCaptured())).toEqual(["paymentId"]);
  });
});
