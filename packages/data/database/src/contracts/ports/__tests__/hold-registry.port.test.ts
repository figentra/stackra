/**
 * Stackra file contract:
 * Purpose: unit tests of the `HoldRegistry` port: a driver extends it with `Driver(HoldRegistry)`, is an instance of
 *          the port, and answers which of the asked ids are held.
 * Boundary: test only; the driver is a stand-in for the compliance service's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0134 (2026-10-24 amendment); ADR 0294 (decision 16); ADR 0022; ADR 0269.
 */
import { Driver } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { HasPublicId, Model } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { Disposal } from "#contracts/enums/disposal.enum";
import { HoldRegistry } from "#contracts/ports/hold-registry.port";

class Matter extends Model.with(HasPublicId("mat")) {}

/** Holds `mat_1` only. */
class OneHoldRegistryDriver extends Driver(HoldRegistry) {
  async heldAmong<M extends object>(
    _model: AnyClass<M>,
    ids: readonly string[],
    _disposal: Disposal,
  ): Promise<ReadonlySet<string>> {
    return new Set(ids.filter((id) => id === "mat_1"));
  }
}

describe("HoldRegistry", () => {
  it("is a port its driver implements", async () => {
    const driver = new OneHoldRegistryDriver();
    expect(driver).toBeInstanceOf(HoldRegistry);
    expect(driver).toBeInstanceOf(Port);
    expect([...(await driver.heldAmong(Matter, ["mat_1", "mat_2"], Disposal.Purge))]).toEqual([
      "mat_1",
    ]);
  });
});
