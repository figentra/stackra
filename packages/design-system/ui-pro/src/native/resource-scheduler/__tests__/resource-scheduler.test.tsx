/**
 * Stackra file contract:
 * Purpose: proves the native ResourceScheduler draws one column per resource and day with its bookings named in full;
 *          a finished drag proposes the booking moved and snapped (or resized from its edge, or moved to the next
 *          column by a horizontal drag), and only when it changed; each screen-reader action proposes the same as a
 *          drag, and a fixed booking offers none.
 * Boundary: React Native does not render in vitest: react-native (View, PanResponder, I18nManager) and
 *           `@stackra/ui/native` are replaced by stand-ins; a PanResponder stand-in hands back its config, so a test
 *           calls the release handler with the distance the finger moved.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); WCAG 2.2 SC 2.5.7; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { SchedulerEvent } from "#contracts/types/scheduler-event.type";
import { ResourceScheduler } from "#native/resource-scheduler/resource-scheduler";

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
      return createElement(
        "div",
        { "data-testid": id, "aria-label": props["accessibilityLabel"] },
        props["children"] as ReactNode,
      );
    },
  };
});
vi.mock("@stackra/ui/native", async () => {
  const { formatMessage } = await import("@stackra/i18n");
  return {
    // The real hook falls back to the English catalogue with no I18nProvider; the mock does the same.
    useCatalogueText:
      (english: Parameters<typeof formatMessage>[0]) =>
      (key: Parameters<typeof formatMessage>[1], values?: Parameters<typeof formatMessage>[2]) =>
        formatMessage(english, key, values, "en"),
    Text: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
  };
});

/** The release handler of a booking's move or resize gesture. */
type Release = (event: unknown, state: { dx: number; dy: number }) => void;
const releaseOf = (id: string): Release =>
  ((views.get(id)?.["config"] ?? views.get(id)) as { onPanResponderRelease: Release })
    .onPanResponderRelease;

const EVENTS: SchedulerEvent[] = [
  { id: "bk_1", title: "Cut, Sara", day: "2026-11-02", resource: "amal", start: 600, end: 660 },
  {
    id: "bk_2",
    title: "Fixed",
    day: "2026-11-02",
    resource: "nour",
    start: 540,
    end: 570,
    isMovable: false,
  },
];

/** Renders the day with a spy for proposals. */
function renderDay(): ReturnType<typeof vi.fn> {
  const onEventChange = vi.fn();
  render(
    <ResourceScheduler
      label="Bookings"
      view="day"
      days={["2026-11-02"]}
      resources={[
        { id: "amal", label: "Amal", labelText: "Amal" },
        { id: "nour", label: "Nour", labelText: "Nour" },
      ]}
      startMinute={480}
      endMinute={1080}
      slotMinutes={15}
      slotHeight={30}
      events={EVENTS}
      onEventChange={onEventChange}
      formatMinute={(minute) =>
        `${Math.floor(minute / 60)}:${String(minute % 60).padStart(2, "0")}`
      }
      formatDay={(day) => day}
      keyboardHint="Use the actions to move"
    />,
  );
  // The first column is 100 points wide.
  act(() =>
    (views.get("column-2026-11-02:amal")?.["onLayout"] as ((layout: object) => void) | undefined)?.(
      {
        nativeEvent: { layout: { width: 100 } },
      },
    ),
  );
  return onEventChange;
}

describe("ResourceScheduler (native)", () => {
  beforeEach(() => views.clear());

  it("draws a column per resource and names each booking in full", () => {
    renderDay();
    expect(screen.getByLabelText("Amal, 2026-11-02")).toBeTruthy();
    expect(views.get("booking-bk_1")?.["accessibilityLabel"]).toBe(
      "Cut, Sara, Amal, 2026-11-02 10:00 – 11:00",
    );
    expect(views.get("booking-bk_1")?.["accessibilityHint"]).toBe("Use the actions to move");
  });

  it("proposes a dragged booking snapped to the step, and nothing for a drag that moves nothing", () => {
    const onEventChange = renderDay();
    // 2 points per minute: 62 points down is 31 minutes, snapped to 30.
    act(() => releaseOf("booking-bk_1")(null, { dx: 0, dy: 62 }));
    expect(onEventChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ start: 630, end: 690 }),
    );
    act(() => releaseOf("booking-bk_1")(null, { dx: 10, dy: 4 }));
    expect(onEventChange).toHaveBeenCalledOnce();
  });

  it("moves a booking to the next column with a horizontal drag and resizes it from its edge", () => {
    const onEventChange = renderDay();
    act(() => releaseOf("booking-bk_1")(null, { dx: 110, dy: 0 }));
    expect(onEventChange).toHaveBeenLastCalledWith(expect.objectContaining({ resource: "nour" }));
    act(() => releaseOf("booking-resize-handle")(null, { dx: 0, dy: 60 }));
    expect(onEventChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ start: 600, end: 690 }),
    );
  });

  it("offers screen-reader actions that do what a drag does, and none on a fixed booking", () => {
    const onEventChange = renderDay();
    const booking = views.get("booking-bk_1") ?? {};
    const names = (booking["accessibilityActions"] as { name: string; label: string }[]).map(
      (action) => action.label,
    );
    expect(names).toContain("Move to the next column");
    const run = (actionName: string) =>
      act(() =>
        (booking["onAccessibilityAction"] as (event: object) => void)({
          nativeEvent: { actionName },
        }),
      );
    run("move_later");
    expect(onEventChange).toHaveBeenLastCalledWith(expect.objectContaining({ start: 615 }));
    run("decrement");
    expect(onEventChange).toHaveBeenLastCalledWith(expect.objectContaining({ start: 585 }));
    run("lengthen");
    expect(onEventChange).toHaveBeenLastCalledWith(expect.objectContaining({ end: 675 }));
    run("move_next");
    expect(onEventChange).toHaveBeenLastCalledWith(expect.objectContaining({ resource: "nour" }));
    expect(views.get("booking-bk_2")?.["accessibilityActions"]).toEqual([]);
  });
});
