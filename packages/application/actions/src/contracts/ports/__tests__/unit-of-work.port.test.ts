/**
 * Stackra file contract:
 * Purpose: unit tests of the `UnitOfWork` port: it is an abstract `Port` (its own token, never built directly) and
 *          a driver commits a resolved work and rolls back a rejected one.
 * Boundary: test only; the driver here is a stand-in for the implementing package's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0263 (ports).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { UnitOfWork } from "#contracts/ports/unit-of-work.port";

class LogDriver extends Driver(UnitOfWork) {
  readonly log: string[] = [];

  async transaction<T>(work: () => Promise<T>): Promise<T> {
    this.log.push("begin");
    try {
      const value = await work();
      this.log.push("commit");
      return value;
    } catch (error) {
      this.log.push("rollback");
      throw error;
    }
  }
}

describe("UnitOfWork", () => {
  it("is an abstract port", () => {
    expect(UnitOfWork.prototype).toBeInstanceOf(Port);
  });

  it("is implemented by a driver", async () => {
    const driver = new LogDriver();
    expect(await driver.transaction(async () => 1)).toBe(1);
    await expect(
      driver.transaction(async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    expect(driver.log).toEqual(["begin", "commit", "begin", "rollback"]);
  });
});
