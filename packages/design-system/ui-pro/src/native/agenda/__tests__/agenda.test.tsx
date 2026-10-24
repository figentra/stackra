/**
 * Stackra file contract:
 * Purpose: proves the native Agenda passes every prop of the root through unchanged (the `useAgenda` state, the snap points and `testID`), and exposes HeroUI Native Pro's own parts and hooks.
 * Boundary: React Native does not render in vitest, so the heroui-native-pro/agenda subpath is replaced by a
 *          recording stand-in that renders plain DOM; what reaches HeroUI Native Pro is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-009
import { render } from "@testing-library/react";
import {
  Agenda as HeroAgenda,
  type UseAgendaReturn,
  useAgenda as heroUseAgenda,
} from "heroui-native-pro/agenda";
import type { ReactNode } from "react";

import { Agenda, useAgenda } from "#native/agenda/agenda";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/agenda", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    Agenda: Object.assign(root, {
      Background: part(),
      Header: part(),
      Calendar: part(),
      CalendarHeader: part(),
      CalendarGrid: part(),
      Heading: part(),
      TodayButton: part(),
      NavButton: part(),
      DragArea: part(),
      DragHandle: part(),
      Body: part(),
      WeekHeader: part(),
      AllDaySection: part(),
      TimeGrid: part(),
      DayColumns: part(),
      Event: part(),
      EventTitle: part(),
      EventTime: part(),
      CurrentTimeIndicator: part(),
      MonthGrid: part(),
      ViewSelector: part(),
    }),
    useAgenda: () => undefined,
  };
});

describe("Agenda (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("passes every prop through unchanged", () => {
    render(
      <Agenda
        {...({} as UseAgendaReturn)}
        view="week"
        startHour={8}
        endHour={18}
        snapIndex={1}
        testID="found"
      />,
    );
    expect(received.props).toMatchObject({
      view: "week",
      startHour: 8,
      endHour: 18,
      snapIndex: 1,
      testID: "found",
    });
  });

  it.each([
    "Background",
    "Header",
    "Calendar",
    "CalendarHeader",
    "CalendarGrid",
    "Heading",
    "TodayButton",
    "NavButton",
    "DragArea",
    "DragHandle",
    "Body",
    "WeekHeader",
    "AllDaySection",
    "TimeGrid",
    "DayColumns",
    "Event",
    "EventTitle",
    "EventTime",
    "CurrentTimeIndicator",
    "MonthGrid",
    "ViewSelector",
  ] as const)("exposes HeroUI Native Pro's own %s", (name) => {
    expect(Agenda[name]).toBe(HeroAgenda[name]);
  });

  it("re-exports HeroUI Native Pro's hooks", () => {
    expect(useAgenda).toBe(heroUseAgenda);
  });
});
