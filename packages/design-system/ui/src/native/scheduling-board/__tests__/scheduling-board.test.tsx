/**
 * Stackra file contract:
 * Purpose: proves the native SchedulingBoard names its rows and blocks, hides and shows a group, makes empty slots
 *          buttons that select a range (none when read-only), calls `onItemPress`, moves a block one slot later from
 *          its accessibility action with the screen's conflicts in the change, puts it back when the screen's promise
 *          answers false, and shows its empty and loading states.
 * Boundary: react-native is the DOM stand-in of `#testing/fakes/native-dom` with a recording Pressable (for the
 *           accessibility actions and states) and a recording announcer; HeroUI Native and the house parts (Text,
 *           Heading, Button, IconButton, SegmentedControl, Icon, Avatar, Skeleton, EmptyState, haptics) are
 *           stand-ins. The pan itself is React Native's and is not driven here.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); shared modules step 4a (LEADER, 2026-11-09).
 */
// @vitest-environment jsdom
import { CalendarDate } from "@internationalized/date";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { createElement, type ReactNode } from "react";

import type { SchedulingBoardItem } from "#contracts/types/scheduling-board-item.type";
import type { SchedulingBoardResource } from "#contracts/types/scheduling-board-resource.type";
import { SchedulingBoard } from "#native/scheduling-board/scheduling-board";

const recorded = vi.hoisted(() => ({
  pressables: [] as Record<string, unknown>[],
  announced: [] as string[],
}));

vi.mock("react-native", async () => {
  const { createElement: h } = await import("react");
  const { nativeDom } = await import("#testing/fakes/native-dom");
  return {
    ...nativeDom,
    Pressable: (props: Record<string, unknown>) => {
      recorded.pressables.push(props);
      const state = props["accessibilityState"] as
        | { expanded?: boolean; busy?: boolean }
        | undefined;
      return h(
        "button",
        {
          type: "button",
          role: props["accessibilityRole"] as string | undefined,
          "aria-label": props["accessibilityLabel"] as string | undefined,
          "aria-expanded": state?.expanded,
          "aria-busy": state?.busy,
          onClick: props["onPress"] as (() => void) | undefined,
        },
        props["children"] as ReactNode,
      );
    },
    PanResponder: { create: () => ({ panHandlers: {} }) },
    AccessibilityInfo: {
      announceForAccessibility: (text: string) => recorded.announced.push(text),
    },
  };
});
vi.mock("heroui-native", () => ({ useThemeColor: () => "color", useIsRTL: () => false }));
vi.mock("#native/text/text", async () => (await import("#testing/fakes/text-dom")).textDom);
vi.mock("#native/heading/heading", () => ({
  Heading: (props: { children: ReactNode }) => createElement("h2", null, props.children),
}));
vi.mock("#native/button/button", () => ({
  Button: (props: { children: ReactNode; onPress: () => void }) =>
    createElement("button", { type: "button", onClick: props.onPress }, props.children),
}));
vi.mock("#native/icon-button/icon-button", () => ({
  IconButton: (props: { label: string; onPress: () => void }) =>
    createElement("button", { type: "button", onClick: props.onPress, "aria-label": props.label }),
}));
vi.mock("#native/segmented-control/segmented-control", () => ({
  SegmentedControl: () => null,
}));
vi.mock("#native/icon/icon", () => ({ Icon: () => null }));
vi.mock("#native/avatar/avatar", () => ({ Avatar: () => null }));
vi.mock("#native/skeleton/skeleton", () => ({ Skeleton: () => null }));
vi.mock("#native/empty-state/empty-state", () => ({
  EmptyState: (props: { title: ReactNode }) => createElement("p", null, props.title),
}));
vi.mock("#native/haptics/haptics", () => ({ haptics: { play: () => undefined } }));

const at = (hour: number, minute = 0) => new Date(Date.UTC(2026, 10, 9, hour, minute));
const RESOURCES: SchedulingBoardResource[] = [
  { id: "sara", label: "Sara", kind: "person", group: "Coaches" },
  { id: "pitch", label: "Pitch", kind: "room" },
  { id: "half", label: "Half A", kind: "room", parentId: "pitch" },
];
const ITEMS: SchedulingBoardItem[] = [
  {
    id: "lesson",
    resourceIds: ["sara"],
    start: at(9),
    end: at(10),
    kind: "booking",
    title: "Lesson",
  },
  {
    id: "match",
    resourceIds: ["pitch"],
    start: at(10),
    end: at(11),
    kind: "booking",
    title: "Match",
  },
];
const base = {
  label: "Branch schedule",
  resources: RESOURCES,
  items: ITEMS,
  timeZone: "UTC",
  now: at(8),
  defaultDate: new CalendarDate(2026, 11, 9),
  defaultView: "day" as const,
  slotMinutes: 30,
  startHour: 8,
  endHour: 12,
};
/** Answers nothing, until a test's promise hands over its resolver. */
const noAnswer = (_ok: boolean): void => undefined;
const LESSON = /^Lesson, 9:00\sAM – 10:00\sAM, Sara$/;
const LESSON_LATER = /^Lesson, 9:30\sAM – 10:30\sAM, Sara$/;

/** The last-drawn props of the Pressable whose label matches. */
const pressableOf = (name: RegExp) =>
  // oxlint-disable-next-line unicorn/prefer-array-find -- reason: findLast is ES2023 and the base lib is ES2022
  recorded.pressables.filter((props) => name.test(String(props["accessibilityLabel"]))).at(-1) ??
  {};

/** Runs a block's accessibility action by name. */
const runAction = (name: RegExp, actionName: string) =>
  act(() => {
    const handler = pressableOf(name)["onAccessibilityAction"] as (event: {
      nativeEvent: { actionName: string };
    }) => void;
    handler({ nativeEvent: { actionName } });
  });

/** The native SchedulingBoard. */
describe("SchedulingBoard (native)", () => {
  beforeEach(() => {
    recorded.pressables = [];
    recorded.announced = [];
  });

  /** Rows come in order with their labels, blocks are named by title, time and row, and a press reaches the caller. */
  it("names rows and blocks and calls onItemPress", () => {
    const onItemPress = vi.fn();
    render(<SchedulingBoard {...base} onItemPress={onItemPress} />);
    expect(screen.getByText("Pitch")).toBeTruthy();
    expect(screen.getByText("Half A")).toBeTruthy();
    expect(screen.getByText("Sara")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /^Match, 10:00\sAM – 11:00\sAM, Half A$/ }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: LESSON }));
    expect(onItemPress).toHaveBeenCalledWith(ITEMS[0]);
  });

  /** A group heading says whether it is open, and hides and shows its resources. */
  it("hides and shows a group", () => {
    render(<SchedulingBoard {...base} />);
    const hide = screen.getByRole("button", { name: "Hide Coaches" });
    expect(hide.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(hide);
    expect(screen.queryByText("Sara")).toBeNull();
    const show = screen.getByRole("button", { name: "Show Coaches" });
    expect(show.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(show);
    expect(screen.getByText("Sara")).toBeTruthy();
  });

  /** Each empty slot is a button that selects its range, and a read-only board has none. */
  it("selects a slot, and offers no slots when read-only", () => {
    const onSelectRange = vi.fn();
    const { unmount } = render(<SchedulingBoard {...base} onSelectRange={onSelectRange} />);
    const slots = screen.getAllByRole("button", { name: /^Free, Sara, / });
    expect(slots).toHaveLength(8);
    fireEvent.click(slots[0] as HTMLElement);
    expect(onSelectRange).toHaveBeenCalledWith({
      resourceId: "sara",
      start: at(8),
      end: at(8, 30),
      conflicts: [],
    });
    unmount();
    render(<SchedulingBoard {...base} onSelectRange={onSelectRange} readOnly />);
    expect(screen.queryAllByRole("button", { name: /^Free, / })).toHaveLength(0);
  });

  /** "Move later" moves the block one slot, with the screen's conflicts in the change. */
  it("moves a block one slot later from its accessibility action", () => {
    const onItemChange = vi.fn();
    const leave = { reason: "coach_on_leave", severity: "warn" as const, message: "On leave" };
    render(
      <SchedulingBoard
        {...base}
        onItemChange={onItemChange}
        onItemPress={vi.fn()}
        conflictsOf={() => [leave]}
      />,
    );
    const actions = pressableOf(LESSON)["accessibilityActions"] as { name: string }[];
    expect(actions.map((action) => action.name)).toEqual([
      "earlier",
      "later",
      "up",
      "extend",
      "shorten",
      "open",
    ]);
    runAction(LESSON, "later");
    expect(onItemChange).toHaveBeenCalledWith({
      itemId: "lesson",
      change: "move",
      fromResourceId: "sara",
      toResourceId: "sara",
      start: at(9, 30),
      end: at(10, 30),
      conflicts: [leave],
    });
  });

  /** A promise holds the block where it was moved, busy, and `false` puts it back and says so. */
  it("puts a block back when the screen answers false", async () => {
    let answer: (ok: boolean) => void = noAnswer;
    const onItemChange = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          answer = resolve;
        }),
    );
    render(<SchedulingBoard {...base} onItemChange={onItemChange} />);
    runAction(LESSON, "later");
    const held = screen.getByRole("button", { name: LESSON_LATER });
    expect(held.getAttribute("aria-busy")).toBe("true");
    await act(async () => {
      answer(false);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByRole("button", { name: LESSON })).toBeTruthy();
    expect(screen.queryByRole("button", { name: LESSON_LATER })).toBeNull();
    expect(recorded.announced).toContain("Lesson was put back");
  });

  /** No resources shows the empty state, and loading shows the skeleton instead of the rows. */
  it("shows the empty and loading states", () => {
    const { unmount } = render(<SchedulingBoard {...base} resources={[]} />);
    expect(screen.getByText("No resources to show")).toBeTruthy();
    unmount();
    render(<SchedulingBoard {...base} isLoading />);
    expect(screen.getByLabelText("Loading the schedule")).toBeTruthy();
    expect(screen.queryByText("Sara")).toBeNull();
  });
});
