/**
 * Stackra file contract:
 * Purpose: proves the pending-choice store opens a question and resolves it true or false on `settle`, keeps the last
 *          question while it closes, refuses the question a new one replaces, does nothing when settled with nothing
 *          open, tells listeners about each change only, stops telling one that unsubscribed, and keeps its state the
 *          same object until something changes.
 * Boundary: pure store, no DOM and no React.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0312; ADR 0022 (test placement).
 */
// @covers sta-350:FR-103
import { createPendingChoice } from "#core/functions/create-pending-choice.function";

describe("createPendingChoice", () => {
  it("starts closed with no question", () => {
    const store = createPendingChoice<string>();
    expect(store.getState()).toEqual({ request: undefined, isOpen: false });
  });

  it("opens a question and resolves true on a yes", async () => {
    const store = createPendingChoice<string>();
    const answer = store.ask("Delete?");
    expect(store.getState()).toEqual({ request: "Delete?", isOpen: true });
    store.settle(true);
    await expect(answer).resolves.toBe(true);
    expect(store.getState().isOpen).toBe(false);
  });

  it("resolves false on a no and keeps the question while it closes", async () => {
    const store = createPendingChoice<string>();
    const answer = store.ask("Leave?");
    store.settle(false);
    await expect(answer).resolves.toBe(false);
    expect(store.getState()).toEqual({ request: "Leave?", isOpen: false });
  });

  it("refuses the question a new one replaces", async () => {
    const store = createPendingChoice<string>();
    const first = store.ask("one");
    const second = store.ask("two");
    await expect(first).resolves.toBe(false);
    expect(store.getState()).toEqual({ request: "two", isOpen: true });
    store.settle(true);
    await expect(second).resolves.toBe(true);
  });

  it("answers a question once, so a second settle changes nothing", async () => {
    const store = createPendingChoice<string>();
    const answer = store.ask("once");
    store.settle(true);
    const closed = store.getState();
    store.settle(false);
    await expect(answer).resolves.toBe(true);
    expect(store.getState()).toBe(closed);
  });

  it("does nothing when settled with nothing open", () => {
    const store = createPendingChoice();
    const listener = vi.fn();
    store.subscribe(listener);
    const before = store.getState();
    store.settle(true);
    expect(store.getState()).toBe(before);
    expect(listener).not.toHaveBeenCalled();
  });

  it("tells a listener about each change, and not once it unsubscribed", () => {
    const store = createPendingChoice<string>();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    void store.ask("a");
    expect(listener).toHaveBeenCalledTimes(1);
    store.settle(true);
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    void store.ask("b");
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("works with a bare question and with its functions used on their own", async () => {
    const store = createPendingChoice();
    const { ask, settle } = store;
    const answer = ask();
    expect(store.getState().isOpen).toBe(true);
    settle(true);
    await expect(answer).resolves.toBe(true);
  });
});
