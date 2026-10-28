/**
 * Stackra file contract:
 * Purpose: unit tests of `ScopeCacheNamespaceDriver`: it is a `CacheNamespace` driver, it names the running call's
 *          scope id, the shared namespace `""` for a platform call and outside every call, and each nested or
 *          concurrent call its own scope.
 * Boundary: test only; the context storage is a stack-based stand-in for the AsyncLocalStorage driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0150 (decision 2); ADR 0327 (decision 6).
 */
import { ContextStorage } from "@stackra/actions/contracts";
import { CacheNamespace } from "@stackra/cache/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ScopeCacheNamespaceDriver } from "#core/drivers/scope-cache-namespace.driver";

/** Synchronous `run` nesting, enough for these calls. */
class StackContextStorage extends ContextStorage {
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

const ACME = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w0", path: "platform.acme" };
const GLOBEX = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w9", path: "platform.globex" };

function setup(): { storage: StackContextStorage; driver: ScopeCacheNamespaceDriver } {
  const storage = new StackContextStorage();
  return { storage, driver: new ScopeCacheNamespaceDriver(storage) };
}

describe(ScopeCacheNamespaceDriver, () => {
  it("is a driver of the CacheNamespace port", () => {
    expect(setup().driver).toBeInstanceOf(CacheNamespace);
  });

  it("names the running call's scope id", () => {
    const { storage, driver } = setup();
    expect(storage.run({ scope: ACME }, () => driver.current())).toBe(ACME.id);
  });

  it("names the shared namespace for a platform call and outside every call", () => {
    const { storage, driver } = setup();
    expect(driver.current()).toBe("");
    expect(storage.run({ callId: "call_1" }, () => driver.current())).toBe("");
  });

  it("follows the innermost call, so two scopes never read one namespace", () => {
    const { storage, driver } = setup();
    const names = storage.run({ scope: ACME }, () => [
      driver.current(),
      storage.run({ scope: GLOBEX }, () => driver.current()),
      driver.current(),
    ]);
    expect(names).toEqual([ACME.id, GLOBEX.id, ACME.id]);
  });
});
