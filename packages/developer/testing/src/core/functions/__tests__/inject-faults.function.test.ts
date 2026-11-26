/**
 * Stackra file contract:
 * Purpose: unit tests of `injectFaults`: a `before` fault never reaches the target, an `after` fault reaches it and
 *          loses the answer, call numbers pick which calls fail (one, a list, every), a rule's own error replaces the
 *          default, `heal()` lets every later call through, every call is recorded in order, the wrapped target keeps
 *          its prototype and runs on the real object (its own internal calls neither recorded nor faulted), and a rule
 *          naming no method or a bad call number throws at once.
 * Boundary: test only; a small in-memory store stands in for any port.
 * Runtime: node (vitest)
 * Governing contract: ADR 0182 (decision 4); ADR 0269 (decision 2); ADR 0022 (test placement).
 */
import { describe, expect, it } from "vitest";

import { InjectedFaultError } from "#core/errors/injected-fault.error";
import { injectFaults } from "#core/functions/inject-faults.function";

/** A store with a private map, an internal helper and a sync method. */
class Store {
  private readonly rows = new Map<string, string>();

  async put(id: string, value: string): Promise<void> {
    this.rows.set(id, value);
  }

  async get(id: string): Promise<string | undefined> {
    return this.rows.get(id);
  }

  async copy(from: string, to: string): Promise<void> {
    const value = await this.get(from);
    if (value !== undefined) await this.put(to, value);
  }

  size(): number {
    return this.rows.size;
  }
}

describe(injectFaults, () => {
  it("fails a call before it reaches the target", async () => {
    const store = new Store();
    const faulty = injectFaults(store, [{ method: "put" }]);
    await expect(faulty.target.put("a", "1")).rejects.toBeInstanceOf(InjectedFaultError);
    expect(await store.get("a")).toBeUndefined();
    await faulty.target.put("a", "2");
    expect(await store.get("a")).toBe("2");
  });

  it("lets the target act, then loses the answer", async () => {
    const store = new Store();
    const faulty = injectFaults(store, [{ method: "put", when: "after" }]);
    const failure = await faulty.target.put("a", "1").catch((error: unknown) => error);
    expect(failure).toMatchObject({ method: "put", call: 1, timing: "after" });
    expect((failure as Error).message).toBe(
      "injected fault: put call 1 acted, then its answer was lost",
    );
    expect(await store.get("a")).toBe("1");
  });

  it("throws at once after a plain (not promised) answer", () => {
    const faulty = injectFaults(new Store(), [{ method: "size", when: "after" }]);
    expect(() => faulty.target.size()).toThrow(InjectedFaultError);
  });

  it("fails the calls the rule numbers, and only those", async () => {
    const faulty = injectFaults(new Store(), [{ method: "put", calls: [2, 4] }]);
    const outcomes = await Promise.allSettled(
      ["1", "2", "3", "4", "5"].map((value) => faulty.target.put("a", value)),
    );
    expect(outcomes.map((outcome) => outcome.status)).toEqual([
      "fulfilled",
      "rejected",
      "fulfilled",
      "rejected",
      "fulfilled",
    ]);
    const single = injectFaults(new Store(), [{ method: "get", calls: 3 }]);
    await single.target.get("a");
    await single.target.get("a");
    await expect(single.target.get("a")).rejects.toThrow("get call 3");
  });

  it("fails every call until healed", async () => {
    const store = new Store();
    const faulty = injectFaults(store, [{ method: "put", calls: "every" }]);
    await expect(faulty.target.put("a", "1")).rejects.toThrow(InjectedFaultError);
    await expect(faulty.target.put("a", "2")).rejects.toThrow(InjectedFaultError);
    faulty.heal();
    await faulty.target.put("a", "3");
    expect(await store.get("a")).toBe("3");
    expect(faulty.faults().map((call) => call.call)).toEqual([1, 2]);
  });

  it("fails with the rule's own error, made per call", async () => {
    class OutageError extends Error {}
    const faulty = injectFaults(new Store(), [
      {
        method: "get",
        calls: "every",
        error: (call) => new OutageError(`down at ${call.method} #${call.call}`),
      },
    ]);
    await expect(faulty.target.get("a")).rejects.toThrow(new OutageError("down at get #1"));
    await expect(faulty.target.get("a")).rejects.toThrow("down at get #2");
  });

  it("records every outside call in order, with its arguments and fault", async () => {
    const faulty = injectFaults(new Store(), [{ method: "put", when: "after" }]);
    await faulty.target.put("a", "1").catch(() => undefined);
    await faulty.target.get("a");
    expect(faulty.calls).toEqual([
      { method: "put", call: 1, args: ["a", "1"], fault: "after" },
      { method: "get", call: 1, args: ["a"], fault: undefined },
    ]);
    expect(faulty.callsOf("get")).toHaveLength(1);
    expect(Object.isFrozen(faulty.calls[0])).toBe(true);
  });

  it("keeps the prototype and runs the target's own calls unrecorded and unfaulted", async () => {
    const store = new Store();
    await store.put("a", "1");
    const faulty = injectFaults(store, [{ method: "put", calls: "every" }]);
    expect(faulty.target).toBeInstanceOf(Store);
    // copy calls get and put on the real store, past the proxy
    await faulty.target.copy("a", "b");
    expect(await store.get("b")).toBe("1");
    expect(faulty.calls.map((call) => call.method)).toEqual(["copy"]);
    expect(faulty.target.size()).toBe(2);
  });

  it("refuses a rule that names no method of the target", () => {
    expect(() => injectFaults(new Store(), [{ method: "drop" as "put" }])).toThrow(
      'injectFaults: the target has no method "drop"',
    );
  });

  it("refuses a call number that is not a whole number from 1", () => {
    expect(() => injectFaults(new Store(), [{ method: "put", calls: 0 }])).toThrow(
      'call numbers of "put" are whole numbers from 1, got 0',
    );
    expect(() => injectFaults(new Store(), [{ method: "put", calls: [1, 1.5] }])).toThrow(
      TypeError,
    );
  });
});
