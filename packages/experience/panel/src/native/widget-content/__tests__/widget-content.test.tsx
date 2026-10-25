/**
 * Stackra file contract:
 * Purpose: unit tests of the native `WidgetContent`: a list draws its rows, a Custom display hands its renderer the answer,
 *          and a View display shows the not-shown state.
 * Boundary: unit tier, jsdom; `react-native` and `@stackra/ui/native` are DOM stand-ins and translation returns the key.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 14); ADR 0164.
 */
// @vitest-environment jsdom
import type { QueryRef } from "@stackra/clients";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { WidgetDisplay } from "#core/constants/widget-display.constant";
import { widget } from "#core/functions/widget.function";
import type { CustomWidgetProps } from "#core/types/custom-widget-props.type";
import type { WidgetRenderer } from "#core/types/widget-renderer.type";
import { WidgetContent } from "#native/widget-content/widget-content";

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: { readonly children?: ReactNode }) => createElement("div", null, props.children),
  };
});

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

afterEach(cleanup);

describe("WidgetContent", () => {
  it("draws a list's rows", () => {
    const list = widget(WidgetStub, {
      key: "inventory.low_stock",
      query: OrderKpisQuery,
      display: WidgetDisplay.list({ primary: "variantId", secondary: "locationId" }),
    });
    render(
      <WidgetContent
        widget={list}
        data={{ items: [{ variantId: "var_1", locationId: "loc_1" }] }}
        isRefreshing={false}
      />,
    );
    expect(screen.getByText("var_1 | loc_1")).toBeTruthy();
  });

  it("hands a Custom renderer the answer and shows the not-shown state for a view", () => {
    const seen: CustomWidgetProps[] = [];
    const Renderer = (props: CustomWidgetProps) => {
      seen.push(props);
      return null;
    };
    const custom = widget(WidgetStub, {
      key: "loyalty_kit.points_balance",
      query: OrderKpisQuery,
      display: WidgetDisplay.custom(),
      renderer: Renderer as WidgetRenderer,
    });
    render(<WidgetContent widget={custom} data={{ balance: 9 }} isRefreshing={false} />);
    expect(seen[0]).toEqual({ data: { balance: 9 }, isRefreshing: false });
    cleanup();
    const view = widget(WidgetStub, {
      key: "orders.awaiting",
      query: OrderKpisQuery,
      display: WidgetDisplay.view("awaiting_payment"),
    });
    render(<WidgetContent widget={view} data={{}} isRefreshing={false} />);
    expect(screen.getByText("panel::widgets.not_rendered")).toBeTruthy();
  });
});
