/**
 * Stackra file contract:
 * Purpose: proves the editing hooks the web and native components share: `useColumnEditorState` (name, open and close
 *          a column, show or hide, rename and pin through the engine), `useRuleBuilderState` (match, add, remove, and a
 *          condition's field, operator and value), `usePeriodPickerState` (the default period, presets, a custom range,
 *          the comparison and its mode) and `useTaskTrayState` (headline, words and the collapsed toggle).
 * Boundary: the hooks through `renderHook` in jsdom, without an i18n provider (English words); the engine is a stand-in
 *           that records its calls.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022; STA-1371.
 */
// @vitest-environment jsdom
import { CalendarDate } from "@internationalized/date";
import { NumberingSystem } from "@stackra/i18n";
import { act, renderHook } from "@testing-library/react";

import type { CollectionController } from "#contracts/types/collection-controller.type";
import type { RuleCondition } from "#contracts/types/rule-condition.type";
import type { RuleField } from "#contracts/types/rule-field.type";
import type { RuleGroup } from "#contracts/types/rule-group.type";
import type { TaskTrayTask } from "#contracts/types/task-tray-task.type";
import { useColumnEditorState } from "#react/hooks/use-column-editor-state";
import { usePeriodPickerState } from "#react/hooks/use-period-picker-state";
import { useRuleBuilderState } from "#react/hooks/use-rule-builder-state";
import { useTaskTrayState } from "#react/hooks/use-task-tray-state";

/** Writes numbers in English. */
const format = (value: number, options?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat("en", options).format(value);

describe("useColumnEditorState", () => {
  const updateColumn = vi.fn();
  const collection = {
    columns: [
      { id: "name", label: "Name", defaultLabel: "Name", isHidden: false, canHide: false },
      { id: "sku", label: "SKU", defaultLabel: "SKU", isHidden: true, canHide: true },
    ],
    updateColumn,
  } as unknown as CollectionController;

  it("names itself, opens and closes a column, and sends every change to the engine", () => {
    const { result } = renderHook(() => useColumnEditorState(collection, undefined));
    expect(result.current.name).toBe("Columns");
    expect(result.current.pinItems.map((item) => item.id)).toEqual(["start", "none", "end"]);
    // Nothing is open, so rename and pin change nothing.
    result.current.rename("x");
    result.current.setPin("start");
    expect(updateColumn).not.toHaveBeenCalled();

    act(() => result.current.toggle("sku"));
    expect(result.current.open?.id).toBe("sku");
    result.current.rename("Code");
    expect(updateColumn).toHaveBeenLastCalledWith("sku", { label: "Code" });
    result.current.setPin("end");
    expect(updateColumn).toHaveBeenLastCalledWith("sku", { pin: "end" });
    result.current.setPin("none");
    expect(updateColumn).toHaveBeenLastCalledWith("sku", { pin: null });
    result.current.setShown("sku", true);
    expect(updateColumn).toHaveBeenLastCalledWith("sku", { isHidden: false });

    act(() => result.current.toggle("sku"));
    expect(result.current.openId).toBeNull();
    act(() => result.current.setOpenId("name"));
    expect(result.current.open?.id).toBe("name");
  });

  it("takes the caller's name", () => {
    const { result } = renderHook(() => useColumnEditorState(collection, "Fields"));
    expect(result.current.name).toBe("Fields");
  });
});

describe("useRuleBuilderState", () => {
  const fields: readonly RuleField[] = [
    { key: "name", label: "Name", type: "text" },
    { key: "qty", label: "Quantity", type: "number" },
    { key: "state", label: "State", type: "choice", options: [{ id: "open", label: "Open" }] },
  ];
  const condition: RuleCondition = { id: "a", field: "name", operator: "contains", value: "x" };
  const group: RuleGroup = {
    match: "all",
    conditions: [condition],
  };

  it("switches the match, adds on the first field and removes a condition", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useRuleBuilderState({ fields, value: group, onChange }));
    expect(result.current.matchItems.map((item) => item.id)).toEqual(["all", "any"]);
    expect(result.current.fieldItems).toEqual([
      { id: "name", label: "Name" },
      { id: "qty", label: "Quantity" },
      { id: "state", label: "State" },
    ]);
    result.current.setMatch("any");
    expect(onChange).toHaveBeenLastCalledWith({ ...group, match: "any" });
    result.current.setMatch("other");
    expect(onChange).toHaveBeenLastCalledWith({ ...group, match: "all" });
    result.current.add();
    const added = onChange.mock.lastCall?.[0] as RuleGroup;
    expect(added.conditions[1]).toMatchObject({ field: "name", operator: "equals", value: "" });
    result.current.remove("a");
    expect(onChange).toHaveBeenLastCalledWith({ ...group, conditions: [] });
  });

  it("adds nothing without fields", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useRuleBuilderState({ fields: [], value: group, onChange }),
    );
    result.current.add();
    expect(onChange).not.toHaveBeenCalled();
    expect(result.current.rowOf(condition).field).toBeUndefined();
  });

  it("edits a condition's field, operator and value", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useRuleBuilderState({ fields, value: group, onChange }));
    const row = result.current.rowOf(condition);
    expect(row.field?.key).toBe("name");
    expect(row.needsValue).toBe(true);
    expect(row.operatorItems).toHaveLength(6);
    // "contains" is not a number operator, so the number field takes its first.
    row.setField("qty");
    expect(onChange).toHaveBeenLastCalledWith({
      ...group,
      conditions: [{ id: "a", field: "qty", operator: "equals", value: "" }],
    });
    row.setField("missing");
    expect(onChange).toHaveBeenCalledTimes(1);
    row.setOperator("is_empty");
    expect(onChange).toHaveBeenLastCalledWith({
      ...group,
      conditions: [{ id: "a", field: "name", operator: "is_empty", value: "x" }],
    });
    row.setOperator("greater");
    expect(onChange).toHaveBeenCalledTimes(2);
    row.setValue(null);
    expect(onChange).toHaveBeenLastCalledWith({
      ...group,
      conditions: [{ id: "a", field: "name", operator: "contains", value: "" }],
    });
    const empty = result.current.rowOf({ id: "b", field: "name", operator: "is_empty", value: "" });
    expect(empty.needsValue).toBe(false);
  });

  it("keeps an operator the new field allows", () => {
    const onChange = vi.fn();
    const equals: RuleCondition = { id: "a", field: "name", operator: "equals", value: "x" };
    const value: RuleGroup = { match: "all", conditions: [equals] };
    const { result } = renderHook(() => useRuleBuilderState({ fields, value, onChange }));
    result.current.rowOf(equals).setField("state");
    expect(onChange).toHaveBeenLastCalledWith({
      match: "all",
      conditions: [{ id: "a", field: "state", operator: "equals", value: "" }],
    });
  });
});

describe("usePeriodPickerState", () => {
  const today = new CalendarDate(2026, 10, 30);

  it("starts on the last 30 days with no comparison", () => {
    const { result } = renderHook(() =>
      usePeriodPickerState({ today }, "en", NumberingSystem.Latn),
    );
    expect(result.current.preset).toBe("last_30_days");
    expect(result.current.mode).toBeNull();
    expect(result.current.versus).toBeUndefined();
    expect(result.current.presetItems.at(-1)?.id).toBe("custom");
    expect(result.current.modeItems.length).toBeGreaterThan(0);
  });

  it("changes the preset, the range, the comparison and its mode", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      usePeriodPickerState({ today, onChange }, "en", NumberingSystem.Latn),
    );
    act(() => result.current.choosePreset(null));
    expect(onChange).not.toHaveBeenCalled();
    act(() => result.current.choosePreset("last_7_days"));
    expect(result.current.preset).toBe("last_7_days");
    act(() => result.current.setCompare(true));
    expect(result.current.mode).toBe("previous");
    expect(result.current.versus).toEqual(expect.any(String));
    act(() => result.current.choosePreset("custom"));
    expect(result.current.preset).toBe("custom");
    expect(result.current.mode).toBe("previous");
    const range = { start: new CalendarDate(2026, 10, 1), end: new CalendarDate(2026, 10, 5) };
    act(() => result.current.chooseRange(range));
    expect(result.current.period.range).toEqual(range);
    act(() => result.current.chooseRange(null));
    act(() => result.current.chooseMode("nonsense"));
    const calls = onChange.mock.calls.length;
    const otherMode = result.current.modeItems.find((item) => item.id !== "previous")?.id;
    if (otherMode) {
      act(() => result.current.chooseMode(otherMode));
      expect(result.current.mode).toBe(otherMode);
    }
    act(() => result.current.setCompare(false));
    expect(result.current.mode).toBeNull();
    expect(onChange.mock.calls.length).toBeGreaterThan(calls);
  });

  it("shows a controlled value", () => {
    const value = {
      preset: "custom" as const,
      range: { start: new CalendarDate(2026, 1, 1), end: new CalendarDate(2026, 1, 31) },
      compare: null,
    };
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      usePeriodPickerState({ value, onChange, today }, "en", NumberingSystem.Latn),
    );
    act(() => result.current.choosePreset("this_year"));
    expect(onChange).toHaveBeenCalled();
    expect(result.current.period).toBe(value);
  });
});

describe("useTaskTrayState", () => {
  const halfway: TaskTrayTask = { id: "1", label: "a.csv", status: "running", progress: 40 };
  const unknown: TaskTrayTask = { id: "2", label: "b.csv", status: "running" };
  const failed: TaskTrayTask = { id: "3", label: "c.csv", status: "error" };
  const done: TaskTrayTask = { id: "4", label: "d.csv", status: "done", detail: "12 rows" };
  const queued: TaskTrayTask = { id: "5", label: "e.csv", status: "queued" };
  const tasks: readonly TaskTrayTask[] = [halfway, unknown, failed, done, queued];

  it("writes the headline and each task's word", () => {
    const { result } = renderHook(() => useTaskTrayState({ tasks }, format));
    expect(result.current.headline).toContain("·");
    expect(result.current.finished).toBeGreaterThan(0);
    expect(result.current.wordOf(halfway)).toBe("40%");
    expect(result.current.wordOf(unknown)).toBe("");
    expect(result.current.wordOf(done)).toBe("12 rows");
    expect(result.current.wordOf(queued)).not.toBe("");
  });

  it("names the finished count once nothing runs", () => {
    const { result } = renderHook(() => useTaskTrayState({ tasks: [done] }, format));
    expect(result.current.headline).not.toContain("·");
  });

  it("toggles its own collapsed state and tells the app", () => {
    const onCollapsedChange = vi.fn();
    const { result } = renderHook(() =>
      useTaskTrayState({ tasks, defaultCollapsed: true, onCollapsedChange }, format),
    );
    expect(result.current.isCollapsed).toBe(true);
    act(() => result.current.toggle());
    expect(result.current.isCollapsed).toBe(false);
    expect(onCollapsedChange).toHaveBeenCalledWith(false);
    const controlled = renderHook(() => useTaskTrayState({ tasks, isCollapsed: false }, format));
    act(() => controlled.result.current.toggle());
    expect(controlled.result.current.isCollapsed).toBe(false);
  });
});
