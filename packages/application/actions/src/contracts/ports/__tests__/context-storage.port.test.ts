/**
 * Stackra file contract:
 * Purpose: unit tests of the `ContextStorage` port: it is an abstract `Port` (its own token, never built directly) and
 *          a synchronous driver keeps the value for the work it runs.
 * Boundary: test only; the driver here is a stand-in for the implementing package's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0263 (ports).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ContextStorage } from "#contracts/ports/context-storage.port";

class StackDriver extends Driver(ContextStorage) {
  private readonly stack: object[] = [];

  run<T>(value: object, work: () => T): T {
    this.stack.push(value);
    try {
      return work();
    } finally {
      this.stack.pop();
    }
  }

  current(): object | undefined {
    return this.stack.at(-1);
  }
}

describe("ContextStorage", () => {
  it("is an abstract port", () => {
    expect(ContextStorage.prototype).toBeInstanceOf(Port);
  });

  it("is implemented by a driver", async () => {
    const driver = new StackDriver();
    const value = { callId: "call_1" };
    expect(driver.current()).toBeUndefined();
    expect(driver.run(value, () => driver.current())).toBe(value);
    expect(driver.current()).toBeUndefined();
  });
});
