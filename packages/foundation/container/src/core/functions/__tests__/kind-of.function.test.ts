/**
 * Stackra file contract:
 * Purpose: unit tests of `kindOf`: the nearest registered class in the constructor chain wins, so an author's class
 *          and a host override read their kind base's record, and a class of no kind reads nothing.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 25).
 */
import { describe, expect, it } from "@stackra/testing";

import { kindOf } from "#core/functions/kind-of.function";
import { registerKind } from "#core/functions/register-kind.function";

abstract class ConfigBase {}
registerKind(ConfigBase, "config");

class LedgerConfig extends ConfigBase {
  ledger = "postgres";
}

class HostLedgerConfig extends LedgerConfig {
  override ledger = "memory";
}

class Unrelated {}

describe("kindOf", () => {
  it("reads the record of the nearest registered ancestor", () => {
    expect(kindOf(LedgerConfig)).toEqual({ kind: "config", options: {} });
    expect(kindOf(HostLedgerConfig)).toEqual({ kind: "config", options: {} });
  });

  it("prefers a class's own record over its ancestor's", () => {
    class Special extends LedgerConfig {}
    registerKind(Special, "special", { reason: "test" });
    expect(kindOf(Special)).toEqual({ kind: "special", options: { reason: "test" } });
    expect(kindOf(LedgerConfig)?.kind).toBe("config");
  });

  it("reads nothing for a class of no kind", () => {
    expect(kindOf(Unrelated)).toBeUndefined();
    expect(kindOf(Object.create(null) as object)).toBeUndefined();
  });
});
