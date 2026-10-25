/**
 * Stackra file contract:
 * Purpose: unit tests of `WidgetBody`: a list draws its rows up to the limit with its empty state, a KPI group draws each
 *          KPI, a progress bar binds value and target, a Custom display hands its renderer the answer, and a View
 *          display shows the not-shown state.
 * Boundary: unit tier, jsdom; the web kit is DOM stand-ins and translation returns the key.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 14 and 15); ADR 0164.
 */
// @vitest-environment jsdom
import type { QueryRef } from "@stackra/clients";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { WidgetDisplay } from "#core/constants/widget-display.constant";
import type { DisplayNode } from "#core/types/display-node.type";
import type { CustomWidgetProps } from "#core/types/custom-widget-props.type";
import type { WidgetRenderer } from "#core/types/widget-renderer.type";
import { widget } from "#core/functions/widget.function";
import { WidgetBody } from "#react/widget-body/widget-body";

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
  permission: "orders.order.read",
  input: {},
  output: {},
  invalidateOn: [],
}) as unknown as QueryRef;

/** A widget class stand-in. */
class WidgetStub {
  readonly isStub = true;
}

/** A widget over `display`. */
const tileOf = (display: DisplayNode, renderer?: WidgetRenderer) =>
  widget(WidgetStub, {
    key: "inventory.low_stock",
    query: OrderKpisQuery,
    display,
    ...(renderer === undefined ? {} : { renderer }),
  });

afterEach(cleanup);

describe("WidgetBody", () => {
  it("draws a list up to its limit, or its empty state", () => {
    const list = tileOf(WidgetDisplay.list({ primary: "variantId", meta: "available", limit: 1 }));
    render(
      <WidgetBody
        widget={list}
        data={{
          items: [
            { variantId: "var_1", available: 3 },
            { variantId: "var_2", available: 1 },
          ],
        }}
        isRefreshing={false}
      />,
    );
    expect(screen.getByText("var_1 | 3")).toBeTruthy();
    expect(screen.queryByText(/var_2/)).toBeNull();
    cleanup();
    render(<WidgetBody widget={list} data={{ items: [] }} isRefreshing={false} />);
    expect(screen.getByText("panel::widgets.empty")).toBeTruthy();
  });

  it("draws each KPI of a group and a progress bar", () => {
    const metric = { value: 2, previous: 1, target: 4, series: null };
    render(
      <WidgetBody
        widget={tileOf(
          WidgetDisplay.kpiGroup([WidgetDisplay.kpi("revenue"), WidgetDisplay.kpi("orders")]),
        )}
        data={{ revenue: metric, orders: metric }}
        isRefreshing={false}
      />,
    );
    expect(screen.getByText("inventory::widgets.low_stock.revenue")).toBeTruthy();
    expect(screen.getByText("inventory::widgets.low_stock.orders")).toBeTruthy();
    cleanup();
    render(
      <WidgetBody
        widget={tileOf(WidgetDisplay.progress("revenue"))}
        data={{ revenue: metric }}
        isRefreshing={false}
      />,
    );
    const bar = screen.getByLabelText(
      "inventory::widgets.low_stock.revenue",
    ) as HTMLProgressElement;
    expect(bar.value).toBe(2);
    expect(bar.max).toBe(4);
  });

  it("hands a Custom renderer the answer, and shows the not-shown state for a view", () => {
    const seen: CustomWidgetProps[] = [];
    const Renderer = (props: CustomWidgetProps) => {
      seen.push(props);
      return null;
    };
    render(
      <WidgetBody
        widget={tileOf(WidgetDisplay.custom(), Renderer as WidgetRenderer)}
        data={{ balance: 9 }}
        isRefreshing
      />,
    );
    expect(seen[0]).toEqual({ data: { balance: 9 }, isRefreshing: true });
    cleanup();
    render(
      <WidgetBody
        widget={tileOf(WidgetDisplay.view("awaiting_payment"))}
        data={{}}
        isRefreshing={false}
      />,
    );
    expect(screen.getByText("panel::widgets.not_rendered")).toBeTruthy();
  });
});
