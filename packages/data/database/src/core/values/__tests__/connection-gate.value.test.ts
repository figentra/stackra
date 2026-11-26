/**
 * Stackra file contract:
 * Purpose: unit tests of `ConnectionGate` (STA-1716): on a model pool, chains two and three connections deep finish
 *          with more chains than connections, where the same chains with no gate stall; a pool of ten keeps seven
 *          top-level places four deep; a deeper waiter is served before an earlier shallow one; a chain deeper than
 *          the pool is refused at once and a wait past `waitMs` is refused as retryable, each leaving nothing held;
 *          and a gate that cannot work is refused when built.
 * Boundary: test only. `ModelPool` stands in for the `pg` pool: `use` holds one of `max` connections for its work and
 *           waits, unbounded, when none is free, as `pg` does by default.
 * Runtime: node (vitest)
 * Governing contract: ADR 0473 (the 2026-11-26 note: the gate); ADR 0495 (consequences); STA-1716; ADR 0022; ADR 0269.
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ConnectionPoolExhaustedError } from "#core/errors/connection-pool-exhausted.error";
import { ConnectionGate } from "#core/values/connection-gate.value";

/** A pool of `max` connections that waits, unbounded, for a free one. */
class ModelPool {
  private free: number;

  private readonly waiting: (() => void)[] = [];

  constructor(max: number) {
    this.free = max;
  }

  /** Runs `work` on a connection of its own. */
  async use<T>(work: () => Promise<T>): Promise<T> {
    if (this.free > 0) this.free -= 1;
    else {
      const turn = signal();
      this.waiting.push(turn.open);
      await turn.opened;
    }
    try {
      return await work();
    } finally {
      const next = this.waiting.shift();
      if (next === undefined) this.free += 1;
      else next();
    }
  }
}

/** A promise and the function that settles it. */
class Signal {
  /** Settles once `open` is called. */
  readonly opened: Promise<void>;

  /** Settles `opened`. */
  open: () => void = () => undefined;

  constructor() {
    this.opened = new Promise<void>((resolve) => {
      this.open = resolve;
    });
  }
}

/** A new `Signal`. */
const signal = () => new Signal();

/** A short pause, so the chains overlap. */
const pause = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 2);
  });

/** A chain `depth` connections deep: each level holds its connection and opens the next, as `requiresNew` does. */
function chain(pool: ModelPool, gate: ConnectionGate | undefined, depth: number): Promise<number> {
  const open = (work: () => Promise<number>) =>
    gate === undefined ? pool.use(work) : gate.hold(() => pool.use(work));
  return open(async () => {
    await pause();
    return depth === 1 ? 1 : 1 + (await chain(pool, gate, depth - 1));
  });
}

/** Whether `work` settles within `ms`. */
async function settles(work: Promise<unknown>, ms = 1000): Promise<boolean> {
  let timer: NodeJS.Timeout | undefined;
  const late = new Promise<false>((resolve) => {
    timer = setTimeout(() => {
      resolve(false);
    }, ms);
  });
  try {
    return await Promise.race([work.then(() => true), late]);
  } finally {
    clearTimeout(timer);
  }
}

/** Resolves once the event loop has run what is queued. */
const flush = () =>
  new Promise<void>((resolve) => {
    setImmediate(resolve);
  });

describe(ConnectionGate, () => {
  it("finishes more two-deep chains than the pool has connections, which stall with no gate", async () => {
    const ungated = new ModelPool(4);
    expect(
      await settles(
        Promise.all(Array.from({ length: 8 }, () => chain(ungated, undefined, 2))),
        300,
      ),
    ).toBe(false);

    const pool = new ModelPool(4);
    const gate = new ConnectionGate(4, 2);
    const depths = Promise.all(Array.from({ length: 8 }, () => chain(pool, gate, 2)));
    expect(await settles(depths)).toBe(true);
    expect(await depths).toEqual(Array.from({ length: 8 }, () => 2));
    expect(gate.snapshot()).toEqual({ held: [0, 0], waiting: 0 });
  });

  it("finishes three-deep chains and mixed depths on a pool of three", async () => {
    const pool = new ModelPool(3);
    const gate = new ConnectionGate(3, 4);
    expect(gate.levels).toBe(3);
    const depths = Promise.all(
      Array.from({ length: 12 }, (_, index) => chain(pool, gate, (index % 3) + 1)),
    );
    expect(await settles(depths)).toBe(true);
    expect(gate.snapshot()).toEqual({ held: [0, 0, 0], waiting: 0 });
  });

  it("keeps max - (nesting - 1) top-level places, the rest for deeper levels", async () => {
    const gate = new ConnectionGate(10, 4);
    const releases: (() => void)[] = [];
    const holding = () =>
      gate.hold(() => {
        const turn = signal();
        releases.push(turn.open);
        return turn.opened;
      });
    const top = Array.from({ length: 8 }, holding);
    await flush();
    expect(gate.snapshot()).toEqual({ held: [7, 0, 0, 0], waiting: 1 });
    for (const release of releases.splice(0)) release();
    await flush();
    expect(gate.snapshot()).toEqual({ held: [1, 0, 0, 0], waiting: 0 });
    for (const release of releases.splice(0)) release();
    await Promise.all(top);
    expect(gate.snapshot()).toEqual({ held: [0, 0, 0, 0], waiting: 0 });
  });

  it("serves a deeper waiter before an earlier shallow one that still does not fit", async () => {
    // three connections, two levels: two top-level places, and the third for a nested transaction
    const gate = new ConnectionGate(3, 2);
    const order: string[] = [];
    const aNested = signal();
    const bNests = signal();
    const a = gate.hold(() =>
      gate.hold(async () => {
        order.push("a nested");
        await aNested.opened;
      }),
    );
    const b = gate.hold(async () => {
      await bNests.opened;
      await gate.hold(async () => {
        order.push("b nested");
      });
    });
    await flush();
    expect(gate.snapshot()).toEqual({ held: [2, 1], waiting: 0 });
    const c = gate.hold(async () => {
      order.push("c");
    });
    bNests.open();
    await flush();
    // the pool is full: c waits for a top-level place, b's nested transaction for the nested one
    expect(gate.snapshot()).toEqual({ held: [2, 1], waiting: 2 });
    aNested.open();
    await Promise.all([a, b, c]);
    expect(order).toEqual(["a nested", "b nested", "c"]);
    expect(gate.snapshot()).toEqual({ held: [0, 0], waiting: 0 });
  });

  it("refuses at once a chain deeper than the pool, holding nothing after", async () => {
    const gate = new ConnectionGate(2, 4);
    await expect(
      gate.hold(() => gate.hold(() => gate.hold(() => Promise.resolve(1)))),
    ).rejects.toThrow(/hold 3 connections at once, which a pool of 2/);
    expect(gate.snapshot()).toEqual({ held: [0, 0], waiting: 0 });
  });

  it("refuses a wait past waitMs as retryable, and gives the place back once work throws", async () => {
    const gate = new ConnectionGate(2, 2, 20);
    const held = signal();
    const holding = gate.hold(() => held.opened);
    await flush();
    const refusal = await gate.hold(() => Promise.resolve()).catch((error: unknown) => error);
    expect(isRefusal(refusal, ConnectionPoolExhaustedError)).toBe(true);
    expect((refusal as ConnectionPoolExhaustedError).retryable).toBe(true);
    expect(gate.snapshot()).toEqual({ held: [1, 0], waiting: 0 });
    held.open();
    await holding;
    await expect(gate.hold(() => Promise.reject(new Error("boom")))).rejects.toThrow("boom");
    expect(gate.snapshot()).toEqual({ held: [0, 0], waiting: 0 });
  });

  it("refuses a gate that cannot work", () => {
    expect(() => new ConnectionGate(0, 2)).toThrow(RangeError);
    expect(() => new ConnectionGate(2.5, 2)).toThrow(RangeError);
    expect(() => new ConnectionGate(4, 0)).toThrow(RangeError);
    expect(() => new ConnectionGate(4, 2, -1)).toThrow(RangeError);
    expect(new ConnectionGate(1, 4).levels).toBe(1);
  });
});
