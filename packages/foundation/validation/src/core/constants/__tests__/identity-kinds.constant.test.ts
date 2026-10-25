/**
 * Stackra file contract:
 * Purpose: unit tests of `IDENTITY_KINDS`: frozen snake_case codes covering the kinds whose identity the manifest locks,
 *          and the class form of `@Renamed` accepts a class of each and refuses a binding such as a service.
 * Boundary: test only; the kinds are registered here with stand-in bases, as each kind package does with its own.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 20 and
 *                     22); ADR 0231.
 */
import { registerKind } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { IDENTITY_KINDS } from "#core/constants/identity-kinds.constant";
import { Renamed } from "#core/decorators/renamed.decorator";

describe("IDENTITY_KINDS", () => {
  it("is a frozen list of snake_case codes including blocks, models and actions", () => {
    expect(Object.isFrozen(IDENTITY_KINDS)).toBe(true);
    for (const code of IDENTITY_KINDS) expect(code).toMatch(/^[a-z]+(_[a-z]+)*$/);
    expect(IDENTITY_KINDS).toEqual(expect.arrayContaining(["action", "block", "model", "refusal"]));
  });

  it.each(IDENTITY_KINDS)("lets @Renamed mark a class of kind %s", (kind) => {
    abstract class KindBase {}
    registerKind(KindBase, kind);
    @Renamed("old.key")
    class Moved extends KindBase {}
    expect(Renamed.on(Moved)).toBe("old.key");
  });

  it("refuses a kind whose identity the manifest does not lock", () => {
    abstract class ServiceBase {}
    registerKind(ServiceBase, "service");
    expect(() => {
      @Renamed("old")
      class CartService extends ServiceBase {}
      return CartService;
    }).toThrow(/@renamed may mark .*; CartService is a service/);
  });
});
