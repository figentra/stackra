/**
 * Stackra file contract:
 * Purpose: unit tests of `KpiView`: money is formatted in its currency, the change chip is green when the value moves the
 *          better way (red when lower is better), the threshold tone colours the value, the target is shown, and a
 *          metric without a value shows a dash.
 * Boundary: unit tier, jsdom; the web kit is DOM stand-ins, translation returns the key with its values, numbers print as is.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 15).
 */
// @vitest-environment jsdom
import type { QueryRef } from "@stackra/clients";
import { Tone } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { WidgetDisplay } from "#core/constants/widget-display.constant";
import { widget } from "#core/functions/widget.function";
import { KpiView } from "#react/kpi-view/kpi-view";

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

const TILE = widget(WidgetStub, {
  key: "orders.order_kpis",
  query: OrderKpisQuery,
  display: WidgetDisplay.custom(),
});

afterEach(cleanup);

describe("KpiView", () => {
  it("formats money, the change, the tone and the target", () => {
    const kpi = WidgetDisplay.kpi("revenue", { tones: [{ belowTarget: 1, tone: Tone.Warning }] });
    render(
      <KpiView
        widget={TILE}
        kpi={kpi}
        metric={{ value: 5_000, previous: 4_000, target: 10_000, series: null, currency: "USD" }}
      />,
    );
    expect(screen.getByText("USD 5000").getAttribute("data-tone")).toBe("warning");
    expect(screen.getByText(/panel::widgets.change/).getAttribute("data-tone")).toBe("success");
    expect(screen.getByText(/panel::widgets.target/).textContent).toContain("USD 10000");
  });

  it("colours a rise red when lower is better, and shows a dash without a value", () => {
    const kpi = WidgetDisplay.kpi("waitMinutes", { lowerIsBetter: true });
    render(
      <KpiView
        widget={TILE}
        kpi={kpi}
        metric={{ value: 6, previous: 3, target: null, series: null }}
      />,
    );
    expect(screen.getByText(/panel::widgets.change/).getAttribute("data-tone")).toBe("danger");
    cleanup();
    render(
      <KpiView
        widget={TILE}
        kpi={kpi}
        metric={{ value: null, previous: null, target: null, series: null }}
      />,
    );
    expect(screen.getByText("—")).toBeTruthy();
  });
});
