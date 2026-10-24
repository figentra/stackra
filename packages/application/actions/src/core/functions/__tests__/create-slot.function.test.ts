/**
 * Stackra file contract:
 * Purpose: unit tests of `createSlot` through a point: an `after` slot runs registered and inline extensions in
 *          ascending order as a value pipeline, skipping classes the app does not bind; a `before` slot passes on
 *          replaced arguments and stops at a refusal; a malformed replacement, registered extensions with no connected
 *          app and a slot that is not a property of its point are refused.
 * Boundary: test only; the resolver is a map of instances.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0305 (rules 23 and 25); ADR 0265 (decision 4).
 */
import type { AnyClass } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Extension } from "#core/bases/extension.base";
import { ExtensionPoint } from "#core/bases/extension-point.base";
import { EXTENSION_HOST } from "#core/constants/extension-host.constant";
import { connectExtensions } from "#core/functions/connect-extensions.function";
import { createSlot } from "#core/functions/create-slot.function";
import { registerExtensions } from "#core/functions/register-extensions.function";
import type { ExtensionContext } from "#core/types/extension-context.type";
import type { Resolver } from "#core/types/resolver.type";

class PricingPoint extends ExtensionPoint {
  readonly adjust = ExtensionPoint.after<number, [currency: string]>();

  readonly verify = ExtensionPoint.before<[quantity: number]>();
}

class OrphanPoint extends ExtensionPoint {
  readonly adjust = ExtensionPoint.after<number, []>();
}

class DoubleExtension extends Extension<PricingPoint["adjust"]>({ order: 20 }) {
  async handle(value: number): Promise<number> {
    return value * 2;
  }
}

class UnbootedExtension extends Extension<PricingPoint["adjust"]>({ order: 5 }) {
  async handle(value: number): Promise<number> {
    return value * 1000;
  }
}

class CapExtension extends Extension<PricingPoint["verify"]> {
  async handle(quantity: number): Promise<[quantity: number]> {
    if (quantity > 100) throw new Error("too_many");
    return [Math.max(quantity, 1)];
  }
}

class OrphanExtension extends Extension<OrphanPoint["adjust"]> {
  async handle(value: number): Promise<number> {
    return value;
  }
}

/** A resolver over the given instances. */
function resolverOf(instances: readonly object[]): Resolver {
  const byClass = new Map<AnyClass, object>(
    instances.map((instance) => [instance.constructor as AnyClass, instance]),
  );
  return {
    has: (token) => byClass.has(token),
    get: <T extends object>(token: AnyClass<T>) => byClass.get(token) as T,
  };
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

registerExtensions([
  { point: PricingPoint, slot: "adjust", extension: DoubleExtension },
  { point: PricingPoint, slot: "adjust", extension: UnbootedExtension },
  { point: PricingPoint, slot: "verify", extension: CapExtension, order: 0 },
  { point: OrphanPoint, slot: "adjust", extension: OrphanExtension },
]);

describe(createSlot, () => {
  it("runs an after slot's extensions in order, skipping unbound classes", async () => {
    connectExtensions(resolverOf([new DoubleExtension(), new CapExtension()]), [
      { point: PricingPoint, slot: "adjust", order: 10, handle: (value: number) => value + 1 },
      {
        point: PricingPoint,
        slot: "adjust",
        order: 30,
        handle: (value: number, currency: string) => `${value} ${currency}`,
      },
    ]);
    // (5 + 1) * 2, then formatted: inline 10, class 20, inline 30; the unbooted class at 5 is skipped
    expect(await new PricingPoint().adjust(5, "SAR", ctx)).toBe("12 SAR");
  });

  it("passes replaced arguments through a before slot and stops at a refusal", async () => {
    connectExtensions(resolverOf([new CapExtension()]), [
      {
        point: PricingPoint,
        slot: "verify",
        order: 10,
        handle: (quantity: number) => [quantity + 1],
      },
      { point: PricingPoint, slot: "verify", order: 20, handle: () => undefined },
    ]);
    const point = new PricingPoint();
    expect(await point.verify(0, ctx)).toEqual([2]);
    await expect(point.verify(500, ctx)).rejects.toThrow("too_many");
  });

  it("refuses a before replacement of the wrong length", async () => {
    connectExtensions(resolverOf([]), [
      { point: PricingPoint, slot: "verify", order: 1, handle: () => [1, 2] },
    ]);
    await expect(new PricingPoint().verify(3, ctx)).rejects.toThrow(/tuple of 1/);
  });

  it("refuses registered extensions with no connected app, and a slot outside its point", async () => {
    const saved = EXTENSION_HOST.resolver;
    EXTENSION_HOST.resolver = undefined;
    try {
      await expect(new OrphanPoint().adjust(1, ctx)).rejects.toThrow(/connectExtensions/);
    } finally {
      EXTENSION_HOST.resolver = saved;
    }
    const loose = createSlot("after");
    await expect(loose.call({}, 1, ctx)).rejects.toThrow(/property of its point/);
    expect((loose as unknown as { "~slot": string })["~slot"]).toBe("after");
  });
});
