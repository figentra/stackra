/**
 * Stackra file contract:
 * Purpose: proves the control hooks the web and native components share: `useQuantityStepperState` (bounds, step,
 *          remove at the minimum), `usePopconfirmState` (cancel, a plain confirm, a promise that resolves or rejects),
 *          `useCursorPaginationState` (words, which button spins, which waits) and `useCodeFrameState` (wrap, the
 *          collapse of a long block and its words).
 * Boundary: the hooks through `renderHook` in jsdom, without an i18n provider (English words).
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022; STA-1371.
 */
// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";

import { useCodeFrameState } from "#react/hooks/use-code-frame-state";
import { useCursorPaginationState } from "#react/hooks/use-cursor-pagination-state";
import { usePopconfirmState } from "#react/hooks/use-popconfirm-state";
import { useQuantityStepperState } from "#react/hooks/use-quantity-stepper-state";

describe("useQuantityStepperState", () => {
  it("steps within its bounds and keeps its own count", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useQuantityStepperState({ defaultValue: 1, maxValue: 3, step: 2, onChange }),
    );
    expect(result.current.count).toBe(1);
    expect(result.current.decrement).toMatchObject({ icon: "minus", isDisabled: false });
    act(() => result.current.increment.onPress());
    expect(result.current.count).toBe(3);
    expect(onChange).toHaveBeenLastCalledWith(3);
    expect(result.current.increment.isDisabled).toBe(true);
    act(() => result.current.decrement.onPress());
    act(() => result.current.decrement.onPress());
    expect(result.current.count).toBe(0);
    expect(result.current.decrement.isDisabled).toBe(true);
  });

  it("becomes remove at the minimum when the app can remove", () => {
    const onRemove = vi.fn();
    const { result } = renderHook(() =>
      useQuantityStepperState({ value: 0, onRemove, removeLabel: "Drop" }),
    );
    expect(result.current.decrement).toMatchObject({
      icon: "trash",
      label: "Drop",
      isDisabled: false,
    });
    act(() => result.current.decrement.onPress());
    expect(onRemove).toHaveBeenCalledOnce();
    act(() => result.current.increment.onPress());
    expect(result.current.count).toBe(0);
  });

  it("disables both buttons when disabled", () => {
    const { result } = renderHook(() => useQuantityStepperState({ value: 5, isDisabled: true }));
    expect(result.current.decrement.isDisabled).toBe(true);
    expect(result.current.increment.isDisabled).toBe(true);
    expect(result.current.increment.label).not.toBe("");
  });
});

describe("usePopconfirmState", () => {
  it("cancels and closes", () => {
    const onCancel = vi.fn();
    const onOpenChange = vi.fn();
    const { result } = renderHook(() =>
      usePopconfirmState({ defaultOpen: true, onCancel, onOpenChange }),
    );
    expect(result.current.open).toBe(true);
    act(() => result.current.cancel());
    expect(onCancel).toHaveBeenCalledOnce();
    expect(result.current.open).toBe(false);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("closes at once on a plain confirm", () => {
    const onConfirm = vi.fn();
    const { result } = renderHook(() => usePopconfirmState({ defaultOpen: true, onConfirm }));
    act(() => result.current.confirm());
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(result.current.open).toBe(false);
  });

  it("waits for a promise: closes when it resolves, stays open when it rejects", async () => {
    let outcome: Promise<void> = Promise.resolve();
    const { result } = renderHook(() =>
      usePopconfirmState({ defaultOpen: true, onConfirm: () => outcome }),
    );
    outcome = Promise.reject(new Error("refused"));
    await act(async () => {
      result.current.confirm();
      await outcome.catch(() => undefined);
    });
    expect(result.current).toMatchObject({ open: true, isPending: false });
    outcome = Promise.resolve();
    await act(async () => {
      result.current.confirm();
      await outcome;
    });
    expect(result.current).toMatchObject({ open: false, isPending: false });
  });

  it("follows a controlled open state", () => {
    const onOpenChange = vi.fn();
    const { result } = renderHook(() => usePopconfirmState({ isOpen: true, onOpenChange }));
    act(() => result.current.setOpen(false));
    expect(result.current.open).toBe(true);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("useCursorPaginationState", () => {
  it("gives the catalogue words unless the caller names them", () => {
    const { result } = renderHook(() =>
      useCursorPaginationState({ hasMore: true, nextLabel: "Later" }),
    );
    expect(result.current.nextLabel).toBe("Later");
    expect(result.current.previousLabel).not.toBe("");
    expect(result.current.countLabel(3)).toContain("3");
    expect(result.current.isPager).toBe(true);
    const custom = renderHook(() =>
      useCursorPaginationState({
        hasMore: true,
        mode: "load-more",
        countLabel: (count) => `${count} rows`,
      }),
    );
    expect(custom.result.current.isPager).toBe(false);
    expect(custom.result.current.countLabel(2)).toBe("2 rows");
  });

  it("spins the pressed button and makes the other wait", () => {
    const onNext = vi.fn();
    const onPrevious = vi.fn();
    const { result, rerender } = renderHook(
      ({ isLoading }) =>
        useCursorPaginationState({
          hasMore: true,
          hasPrevious: true,
          onNext,
          onPrevious,
          isLoading,
        }),
      { initialProps: { isLoading: false } },
    );
    expect(result.current.previous.isDisabled).toBe(false);
    act(() => result.current.previous.onPress());
    expect(onPrevious).toHaveBeenCalledOnce();
    rerender({ isLoading: true });
    expect(result.current.previous).toMatchObject({ isLoading: true });
    expect(result.current.next).toMatchObject({ isLoading: false, isDisabled: true });
    act(() => result.current.next.onPress());
    expect(onNext).toHaveBeenCalledOnce();
    expect(result.current.next.isLoading).toBe(true);
    expect(result.current.previous.isDisabled).toBe(true);
  });

  it("disables previous with no earlier page and next with no more", () => {
    const { result } = renderHook(() => useCursorPaginationState({ hasMore: false }));
    expect(result.current.previous.isDisabled).toBe(true);
    expect(result.current.next.isDisabled).toBe(true);
  });
});

describe("useCodeFrameState", () => {
  const code = Array.from({ length: 5 }, (_, index) => `line ${index + 1}`).join("\n");

  it("collapses a long block until expanded", () => {
    const { result } = renderHook(() => useCodeFrameState({ code, maxLines: 3 }));
    expect(result.current.rows).toHaveLength(5);
    expect(result.current.shown).toHaveLength(3);
    expect(result.current.isCollapsible).toBe(true);
    expect(result.current.numberDigits).toBe(1);
    const collapsed = result.current.expandLabel;
    act(() => result.current.toggleExpanded());
    expect(result.current.isExpanded).toBe(true);
    expect(result.current.shown).toHaveLength(5);
    expect(result.current.expandLabel).not.toBe(collapsed);
  });

  it("never collapses at a zero limit and toggles the wrap", () => {
    const { result } = renderHook(() => useCodeFrameState({ code, maxLines: 0, isWrapped: true }));
    expect(result.current.isCollapsible).toBe(false);
    expect(result.current.shown).toHaveLength(5);
    expect(result.current.isWrapped).toBe(true);
    act(() => result.current.toggleWrap());
    expect(result.current.isWrapped).toBe(false);
    const empty = renderHook(() => useCodeFrameState({}));
    expect(empty.result.current.isCollapsible).toBe(false);
  });
});
