/**
 * Stackra file contract:
 * Purpose: unit tests of `WidgetTile`: the title, the loading and error states with a retry, the body over the answer, and
 *          the range picker that changes the query's input.
 * Boundary: unit tier, jsdom; `useQuery` is a spy returning the case's state, the web kit is DOM stand-ins, translation
 *           returns the key, and the container is empty.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 14 and 20).
 */
// @vitest-environment jsdom
import type { QueryRef } from "@stackra/clients";
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { WidgetDisplay } from "#core/constants/widget-display.constant";
import { TimeRange } from "#core/enums/time-range.enum";
import { widget } from "#core/functions/widget.function";
import { WidgetTile } from "#react/widget-tile/widget-tile";

/** Stands in for the permission constants gen emits in an app. */
const TestPermissions = {
  ordersOrderRead: "orders.order.read",
} as const;

const query = vi.hoisted(() => ({ useQuery: vi.fn() }));

vi.mock("@stackra/clients/react", () => ({ useQuery: query.useQuery }));

vi.mock("@stackra/i18n/react", () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values === undefined ? key : `${key} ${JSON.stringify(values)}`,
  }),
  useNumber: () => (value: number) => String(value),
  useMoney: () => (minor: number, currency: string) => `${currency} ${minor}`,
}));

vi.mock("@stackra/ui/react", async () => {
  const { createElement, Fragment } = await import("react");
  type Props = Record<string, unknown> & { readonly children?: unknown };
  const box = (tag: string) => (props: Props) => createElement(tag, null, props.children as never);
  const Card = Object.assign(box("article"), {
    Header: box("header"),
    Title: box("h3"),
    Content: box("div"),
  });
  return {
    Card,
    Skeleton: () => createElement("p", null, "loading"),
    EmptyState: (props: Props) => createElement("p", null, props.title as never),
    ErrorState: (props: Props) => {
      const retry = props.retry as { label: string; onPress: () => void };
      return createElement(
        "div",
        null,
        props.title as never,
        createElement("button", { onClick: retry.onPress }, retry.label),
      );
    },
    Select: (props: Props) =>
      createElement(
        "select",
        {
          "aria-label": props.label,
          value: props.value ?? "",
          onChange: (event: { target: { value: string } }) =>
            (props.onChange as (value: string) => void)(event.target.value),
        },
        (props.items as { id: string; label: string }[]).map((item) =>
          createElement("option", { key: item.id, value: item.id }, item.label),
        ),
      ),
    List: (props: Props) =>
      createElement(
        "ul",
        { "aria-label": props.label },
        (props.items as { id: string; title: string; description?: string; endContent?: unknown }[])
          .length === 0
          ? (props.emptyState as never)
          : (
              props.items as {
                id: string;
                title: string;
                description?: string;
                endContent?: unknown;
              }[]
            ).map((item) =>
              createElement(
                "li",
                { key: item.id },
                [item.title, item.description, item.endContent].filter(Boolean).join(" | "),
              ),
            ),
      ),
    ProgressBar: (props: Props) =>
      createElement("progress", {
        "aria-label": props.label,
        value: props.value,
        max: props.maxValue,
      }),
    Chip: (props: Props) =>
      createElement("span", { "data-tone": props.tone }, props.children as never),
    Icon: (props: Props) => createElement("i", { "data-icon": props.name }),
    Text: (props: Props) =>
      createElement("span", { "data-tone": props.tone }, props.children as never),
    ConfirmationProvider: (props: Props) => createElement(Fragment, null, props.children as never),
  };
});

/** A consumed query ref stand-in. */
const OrderKpisQuery = Object.assign(function OrderKpisQuery() {}, {
  kind: "query",
  key: "orders.order.kpis@1",
  permission: TestPermissions.ordersOrderRead,
  input: {},
  output: {},
  invalidateOn: [],
}) as unknown as QueryRef;

/** A widget class stand-in. */
class WidgetStub {
  readonly isStub = true;
}

const KPIS = widget(WidgetStub, {
  key: "orders.order_kpis",
  query: OrderKpisQuery,
  display: WidgetDisplay.kpi("revenue"),
  ranges: [TimeRange.Today, TimeRange.Last7Days, TimeRange.Custom],
  range: TimeRange.Today,
});

/** The tile under an empty container. */
async function renderTile() {
  const container = await Container.create([]);
  return render(
    <ContainerProvider container={container}>
      <WidgetTile widget={KPIS} />
    </ContainerProvider>,
  );
}

/** A `useQuery` result. */
const state = (patch: Record<string, unknown>) => ({
  data: undefined,
  error: null,
  isPending: false,
  isLoading: false,
  isFetching: false,
  refetch: vi.fn(),
  ...patch,
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("WidgetTile", () => {
  it("shows the loading state under its title", async () => {
    query.useQuery.mockReturnValue(state({ isPending: true }));
    await renderTile();
    expect(screen.getByText("orders::widgets.order_kpis.title")).toBeTruthy();
    expect(screen.getByText("loading")).toBeTruthy();
  });

  it("shows the error with a retry", async () => {
    const result = state({ error: new Error("down") });
    query.useQuery.mockReturnValue(result);
    await renderTile();
    fireEvent.click(screen.getByText("panel::widgets.retry"));
    expect(result.refetch).toHaveBeenCalled();
  });

  it("draws the body and runs the picked range", async () => {
    query.useQuery.mockReturnValue(
      state({ data: { revenue: { value: 5, previous: 4, target: null, series: null } } }),
    );
    await renderTile();
    expect(screen.getByText("5")).toBeTruthy();
    expect(query.useQuery).toHaveBeenLastCalledWith(OrderKpisQuery, { range: "today" });
    const picker = screen.getByLabelText("panel::widgets.range");
    expect(picker.querySelectorAll("option")).toHaveLength(2);
    fireEvent.change(picker, { target: { value: "last_7_days" } });
    expect(query.useQuery).toHaveBeenLastCalledWith(OrderKpisQuery, { range: "last_7_days" });
  });
});
