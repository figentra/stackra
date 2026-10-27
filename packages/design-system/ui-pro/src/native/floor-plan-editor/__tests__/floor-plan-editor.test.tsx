/**
 * Stackra file contract:
 * Purpose: proves the native FloorPlanEditor names each item with its seats, selects on a touch, proposes a dragged
 *          item snapped to whole cells (or resized from its corner) only when it changed, and offers screen-reader
 *          actions that do what a drag does, none on a fixed item.
 * Boundary: React Native does not render in vitest: react-native (View, PanResponder, I18nManager) and
 *           `@stackra/ui/native` are replaced by stand-ins; a PanResponder stand-in hands back its config, so a test
 *           calls the grant and release handlers with the distance the finger moved.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); WCAG 2.2 SC 2.5.7; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import { FloorPlanEditor } from "#native/floor-plan-editor/floor-plan-editor";

/** The props each View stand-in was last handed, by test id. */
const views = vi.hoisted(() => new Map<string, Record<string, unknown>>());

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    I18nManager: { isRTL: false },
    PanResponder: { create: (config: object) => ({ panHandlers: { config } }) },
    View: (props: Record<string, unknown>) => {
      const id = props["testID"] as string | undefined;
      if (id !== undefined) views.set(id, props);
      return createElement("div", { "data-testid": id }, props["children"] as ReactNode);
    },
  };
});
vi.mock("@stackra/ui/native", async () => {
  // The real useCatalogueText lives behind heroui-native; this one formats from the English catalogue, as it does
  // with no I18nProvider.
  const { formatMessage } = await import("@stackra/i18n");
  type Format = Parameters<typeof formatMessage>;
  return {
    useCatalogueText: (english: Format[0]) => (key: Format[1], values?: Format[2]) =>
      formatMessage(english, key, values, "en"),
    Text: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
  };
});

/** A gesture handler of an item. */
type Handler = (event: unknown, state: { dx: number; dy: number }) => void;
const handlerOf = (id: string, name: string): Handler =>
  ((views.get(id)?.["config"] ?? {}) as Record<string, Handler>)[name] as Handler;

const ITEMS = [
  { id: "t1", shape: "round" as const, label: "T1", x: 2, y: 2, width: 2, height: 2, seats: 2 },
  {
    id: "w",
    shape: "wall" as const,
    label: "Wall",
    x: 0,
    y: 7,
    width: 10,
    height: 1,
    isMovable: false,
  },
];

/** Renders the plan with spies. */
function renderPlan(): {
  onItemChange: ReturnType<typeof vi.fn>;
  onSelectionChange: ReturnType<typeof vi.fn>;
} {
  const onItemChange = vi.fn();
  const onSelectionChange = vi.fn();
  render(
    <FloorPlanEditor
      label="Terrace"
      columns={10}
      rows={8}
      cellSize={20}
      items={ITEMS}
      selectedId="t1"
      onItemChange={onItemChange}
      onSelectionChange={onSelectionChange}
      keyboardHint="Use the actions to move"
    />,
  );
  return { onItemChange, onSelectionChange };
}

describe("FloorPlanEditor (native)", () => {
  beforeEach(() => views.clear());

  it("names each item with its seats and selects on a touch", () => {
    const { onSelectionChange } = renderPlan();
    expect(views.get("floor-item-t1")?.["accessibilityLabel"]).toBe("T1, Seats: 2");
    expect(views.get("floor-item-t1")?.["accessibilityState"]).toEqual({
      selected: true,
      disabled: false,
    });
    act(() => handlerOf("floor-item-t1", "onPanResponderGrant")(null, { dx: 0, dy: 0 }));
    expect(onSelectionChange).toHaveBeenCalledWith("t1");
  });

  it("proposes a dragged item snapped to whole cells, and nothing for a drag that moves nothing", () => {
    const { onItemChange } = renderPlan();
    act(() => handlerOf("floor-item-t1", "onPanResponderRelease")(null, { dx: 41, dy: -19 }));
    expect(onItemChange).toHaveBeenLastCalledWith(expect.objectContaining({ x: 4, y: 1 }));
    act(() => handlerOf("floor-item-t1", "onPanResponderRelease")(null, { dx: 4, dy: 4 }));
    expect(onItemChange).toHaveBeenCalledOnce();
    act(() =>
      handlerOf("floor-item-resize-handle", "onPanResponderRelease")(null, { dx: 20, dy: 0 }),
    );
    expect(onItemChange).toHaveBeenLastCalledWith(expect.objectContaining({ width: 3, height: 2 }));
  });

  it("offers screen-reader actions that do what a drag does, and none on a fixed item", () => {
    const { onItemChange } = renderPlan();
    const item = views.get("floor-item-t1") ?? {};
    const labels = (item["accessibilityActions"] as { name: string; label?: string }[]).map(
      (action) => action.label,
    );
    expect(labels).toContain("Make wider");
    const run = (actionName: string) =>
      act(() =>
        (item["onAccessibilityAction"] as (event: object) => void)({ nativeEvent: { actionName } }),
      );
    run("move_end");
    expect(onItemChange).toHaveBeenLastCalledWith(expect.objectContaining({ x: 3 }));
    run("taller");
    expect(onItemChange).toHaveBeenLastCalledWith(expect.objectContaining({ height: 3 }));
    expect(views.get("floor-item-w")?.["accessibilityActions"]).toEqual([{ name: "activate" }]);
  });
});
