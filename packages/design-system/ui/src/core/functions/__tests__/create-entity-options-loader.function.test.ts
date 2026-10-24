/**
 * Stackra file contract:
 * Purpose: proves the entity options loader asks for the first search at once and for later ones after the pause, asks
 *          again for the next page with the cursor, drops a response a later request has replaced, joins pages without
 *          repeating a record, keeps the list after a failed page, treats a loader that throws as a rejection, ignores
 *          the same text twice, tells its listeners, and stops on dispose.
 * Boundary: pure unit test with fake timers and hand-resolved promises.
 * Runtime: node
 * Governing contract: ADR 0318 (wave 7 vocabulary); ADR 0022 (test placement).
 */
// @covers sta-350:FR-199
import type { EntityOptionPage } from "#contracts/types/entity-option-page.type";
import { createEntityOptionsLoader } from "#core/functions/create-entity-options-loader.function";

const page = (ids: string[], nextCursor?: string): EntityOptionPage => ({
  items: ids.map((id) => ({ id, label: id.toUpperCase() })),
  ...(nextCursor === undefined ? {} : { nextCursor }),
});

/** A loader whose requests wait to be answered by the test, in the order they were made. */
function setup(debounceMs = 100) {
  const calls: { search: string; cursor: string | undefined; settle: (answer: unknown) => void }[] =
    [];
  const loadOptions = vi.fn(
    (search: string, cursor?: string) =>
      new Promise<EntityOptionPage>((resolve, reject) => {
        calls.push({
          search,
          cursor,
          settle: (answer) => (answer instanceof Error ? reject(answer) : resolve(answer as never)),
        });
      }),
  );
  const loader = createEntityOptionsLoader({
    getLoad: () => loadOptions,
    getDebounceMs: () => debounceMs,
  });
  return { calls, loadOptions, loader };
}

const flush = () => vi.advanceTimersByTimeAsync(0);

describe("createEntityOptionsLoader", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("asks for the first search at once and shows it as loading", () => {
    const { calls, loader } = setup();
    expect(loader.getState().hasAnswered).toBe(false);
    loader.search("");
    expect(calls.map((call) => call.search)).toEqual([""]);
    expect(loader.getState()).toMatchObject({ status: "loading", hasAnswered: false });
  });

  it("lists the answer and says whether another page follows", async () => {
    const { calls, loader } = setup();
    loader.search("");
    calls[0]?.settle(page(["a", "b"], "c1"));
    await flush();
    expect(loader.getState()).toMatchObject({ status: "idle", hasMore: true, hasAnswered: true });
    expect(loader.getState().options.map((option) => option.id)).toEqual(["a", "b"]);
  });

  it("waits out the pause before a later search, and starts only the last text typed", () => {
    const { calls, loader } = setup(100);
    loader.search("");
    calls[0]?.settle(page(["a"]));
    loader.search("a");
    loader.search("ad");
    vi.advanceTimersByTime(99);
    expect(calls).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(calls.map((call) => call.search)).toEqual(["", "ad"]);
  });

  it("does not search the same text twice", () => {
    const { calls, loader } = setup();
    loader.search("x");
    loader.search("x");
    vi.advanceTimersByTime(1000);
    expect(calls).toHaveLength(1);
  });

  it("drops an answer that a later request has replaced", async () => {
    const { calls, loader } = setup(10);
    loader.search("");
    loader.search("ad");
    vi.advanceTimersByTime(10);
    calls[1]?.settle(page(["ada"]));
    await flush();
    calls[0]?.settle(page(["old"]));
    await flush();
    expect(loader.getState().options.map((option) => option.id)).toEqual(["ada"]);
  });

  it("asks for the next page with the cursor and joins it without repeating a record", async () => {
    const { calls, loader } = setup();
    loader.search("");
    calls[0]?.settle(page(["a", "b"], "c1"));
    await flush();
    loader.loadMore();
    expect(calls[1]).toMatchObject({ search: "", cursor: "c1" });
    expect(loader.getState().isLoadingMore).toBe(true);
    loader.loadMore();
    expect(calls).toHaveLength(2);
    calls[1]?.settle(page(["b", "c"]));
    await flush();
    expect(loader.getState().options.map((option) => option.id)).toEqual(["a", "b", "c"]);
    expect(loader.getState()).toMatchObject({ hasMore: false, isLoadingMore: false });
    loader.loadMore();
    expect(calls).toHaveLength(2);
  });

  it("does not page while a new search waits out its pause", async () => {
    const { calls, loader } = setup(100);
    loader.search("");
    calls[0]?.settle(page(["a"], "c1"));
    await flush();
    loader.search("z");
    loader.loadMore();
    expect(calls).toHaveLength(1);
  });

  it("says it failed, and keeps what was listed when a later page fails", async () => {
    const { calls, loader } = setup();
    loader.search("");
    calls[0]?.settle(page(["a"], "c1"));
    await flush();
    loader.loadMore();
    calls[1]?.settle(new Error("offline"));
    await flush();
    expect(loader.getState()).toMatchObject({ status: "error", hasMore: false });
    expect(loader.getState().options.map((option) => option.id)).toEqual(["a"]);
  });

  it("treats a loader that throws before it returns as a rejection", async () => {
    const loader = createEntityOptionsLoader({
      getLoad: () => () => {
        throw new Error("bad");
      },
      getDebounceMs: () => 0,
    });
    loader.search("");
    await flush();
    expect(loader.getState().status).toBe("error");
  });

  it("tells its listeners about each change until they stop", async () => {
    const { calls, loader } = setup();
    const listener = vi.fn();
    const stop = loader.subscribe(listener);
    loader.search("");
    expect(listener).toHaveBeenCalledTimes(1);
    stop();
    calls[0]?.settle(page(["a"]));
    await flush();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("drops a pending search and a late answer once disposed", async () => {
    const { calls, loader } = setup(100);
    loader.search("");
    loader.search("a");
    loader.dispose();
    vi.advanceTimersByTime(1000);
    calls[0]?.settle(page(["a"]));
    await flush();
    expect(calls).toHaveLength(1);
    expect(loader.getState().options).toEqual([]);
  });
});
