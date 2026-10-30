/**
 * Stackra file contract:
 * Purpose: proves the three hooks the web and native runtimes now share from the React layer: `usePendingActions`
 *          marks a promise-returning action pending until it settles and refuses a second run meanwhile, and never
 *          marks one that returns nothing; `usePendingChoice` opens a question, answers it, and answers no on
 *          unmount; `useEntityOptions` searches through the latest `loadOptions` and holds the answer.
 * Boundary: the hooks through `renderHook` in jsdom; the stores under them have their own tests in `core/`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0004 §1 (the shared React layer); ADR 0022; STA-1371.
 */
// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";

import type { EntityOptionPage } from "#contracts/types/entity-option-page.type";
import { useEntityOptions } from "#react/hooks/use-entity-options";
import { usePendingActions } from "#react/hooks/use-pending-actions";
import { usePendingChoice } from "#react/hooks/use-pending-choice";

/** A promise the test settles by hand. */
function deferred(): { readonly promise: Promise<void>; readonly resolve: () => void } {
  let settle: (() => void) | undefined;
  const promise = new Promise<void>((resolve) => {
    settle = resolve;
  });
  return { promise, resolve: () => settle?.() };
}

describe("usePendingActions", () => {
  it("keeps a promise's key pending until it settles and refuses a second run meanwhile", async () => {
    const settle = deferred();
    const action = vi.fn(() => settle.promise);
    const { result } = renderHook(() => usePendingActions());
    act(() => result.current.run("archive", action));
    act(() => result.current.run("archive", action));
    expect(action).toHaveBeenCalledTimes(1);
    expect(result.current.pending).toEqual(["archive"]);
    await act(async () => settle.resolve());
    expect(result.current.pending).toEqual([]);
  });

  it("clears the key after a rejection and never marks a plain handler", async () => {
    const { result } = renderHook(() => usePendingActions());
    act(() => result.current.run("plain", () => undefined));
    expect(result.current.pending).toEqual([]);
    await act(async () => result.current.run("fails", () => Promise.reject(new Error("no"))));
    expect(result.current.pending).toEqual([]);
    act(() => result.current.run("none", undefined));
    expect(result.current.pending).toEqual([]);
  });
});

describe("usePendingChoice", () => {
  it("opens a question, answers it and answers no when its owner unmounts", async () => {
    const { result, unmount } = renderHook(() => usePendingChoice<string>());
    expect(result.current.isOpen).toBe(false);
    let answer: Promise<boolean> | undefined;
    act(() => {
      answer = result.current.ask("delete?");
    });
    expect(result.current).toMatchObject({ isOpen: true, request: "delete?" });
    act(() => result.current.settle(true));
    await expect(answer).resolves.toBe(true);
    expect(result.current.isOpen).toBe(false);

    act(() => {
      answer = result.current.ask("leave?");
    });
    unmount();
    await expect(answer).resolves.toBe(false);
  });
});

describe("useEntityOptions", () => {
  it("searches through the latest loadOptions and holds the answer", async () => {
    const page: EntityOptionPage = { items: [{ id: "a", label: "A" }] };
    const first = vi.fn(() => Promise.resolve(page));
    const second = vi.fn(() => Promise.resolve(page));
    const { result, rerender } = renderHook(({ load }) => useEntityOptions(load, 0), {
      initialProps: { load: first },
    });
    rerender({ load: second });
    await act(async () => {
      result.current.search("a");
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
    });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith("a", undefined);
    expect(result.current.options).toEqual(page.items);
    expect(result.current.hasAnswered).toBe(true);
  });
});
