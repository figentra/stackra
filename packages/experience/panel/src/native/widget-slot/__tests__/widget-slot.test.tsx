/**
 * Stackra file contract:
 * Purpose: unit tests of the native `WidgetSlot`: the slot's permitted widgets drawn as cards with their displays, `columns`
 *          to a row, nothing for an empty slot, and a column count outside 1 to 4 refused.
 * Boundary: unit tier, jsdom. React Native does not render in vitest, so `react-native` and `@stackra/ui/native` are DOM
 *           stand-ins; `useQuery` answers every query with one metric; translation returns the key.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 14 and 18); ADR 0164.
 */
// @vitest-environment jsdom
import type { QueryRef } from "@stackra/clients";
import { ClientSession } from "@stackra/clients/contracts";
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { WidgetDisplay } from "#core/constants/widget-display.constant";
import { Place } from "#core/enums/place.enum";
import { registerWidgets } from "#core/functions/register-widgets.function";
import { widget } from "#core/functions/widget.function";
import { WidgetSlot } from "#native/widget-slot/widget-slot";

/** Stands in for the permission constants gen emits in an app. */
const TestPermissions = {
  ordersDRead: "orders.d.read",
  ordersOrderRead: "orders.order.read",
} as const;

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: {
      readonly children?: ReactNode;
      readonly className?: string;
      readonly testID?: string;
    }) =>
      createElement(
        "div",
        { className: props.className, "data-testid": props.testID },
        props.children,
      ),
  };
});

vi.mock("@stackra/clients/react", () => ({
  useQuery: () => ({
    data: { revenue: { value: 7, previous: 7, target: null, series: null } },
    error: null,
    isPending: false,
    isLoading: false,
    isFetching: false,
    refetch: () => Promise.resolve(),
  }),
}));

vi.mock("@stackra/i18n/react", () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values === undefined ? key : `${key} ${JSON.stringify(values)}`,
  }),
  useNumber: () => (value: number) => String(value),
  useMoney: () => (minor: number, currency: string) => `${currency} ${minor}`,
}));

vi.mock("@stackra/ui/native", async () => {
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
        createElement("button", { type: "button", onClick: retry.onPress }, retry.label),
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

/** A session holding exactly `permissions`. */
class StubSession extends ClientSession {
  private readonly permissions: readonly string[];

  constructor(permissions: readonly string[]) {
    super();
    this.permissions = permissions;
  }

  headers(): Promise<Readonly<Record<string, string>>> {
    return Promise.resolve({});
  }

  can(permission: string): boolean {
    return this.permissions.includes(permission);
  }
}

const HEADER = { key: "dashboard.header", place: Place.Band };
const kpi = WidgetDisplay.kpi("revenue");

/** The slot under a container whose session holds `permissions`. */
async function renderSlot(node: ReactNode, permissions: readonly string[] = []) {
  const container = await Container.create([], {
    overrides: new Map([[ClientSession, new StubSession(permissions)]]),
  });
  return render(<ContainerProvider container={container}>{node}</ContainerProvider>);
}

afterEach(() => {
  cleanup();
  registerWidgets([]);
});

describe("WidgetSlot", () => {
  it("draws the permitted widgets, columns to a row", async () => {
    registerWidgets([
      widget(WidgetStub, {
        key: "orders.a",
        query: OrderKpisQuery,
        display: kpi,
        slot: HEADER,
        order: 1,
      }),
      widget(WidgetStub, {
        key: "orders.b",
        query: OrderKpisQuery,
        display: kpi,
        slot: HEADER,
        order: 2,
      }),
      widget(WidgetStub, {
        key: "orders.c",
        query: OrderKpisQuery,
        display: kpi,
        slot: HEADER,
        order: 3,
      }),
      widget(WidgetStub, {
        key: "orders.d",
        query: OrderKpisQuery,
        display: kpi,
        slot: HEADER,
        permission: TestPermissions.ordersDRead,
      }),
    ]);
    const view = await renderSlot(<WidgetSlot slot={HEADER} columns={2} />);
    expect(screen.getByText("orders::widgets.a.title")).toBeTruthy();
    expect(screen.queryByText("orders::widgets.d.title")).toBeNull();
    expect(view.container.querySelectorAll(".flex-row")).toHaveLength(2);
    expect(screen.getAllByText("7")).toHaveLength(3);
  });

  it("draws nothing for an empty slot and refuses a bad column count", async () => {
    const view = await renderSlot(<WidgetSlot slot={HEADER} />);
    expect(view.container.innerHTML).toBe("");
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(renderSlot(<WidgetSlot slot={HEADER} columns={5} />)).rejects.toThrow(RangeError);
  });
});
