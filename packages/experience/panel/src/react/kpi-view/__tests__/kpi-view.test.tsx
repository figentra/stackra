/**
 * Stackra file contract:
 * Purpose: unit tests of `KpiView`: money is formatted in its currency, the change chip is green when the value moves the
 *          better way (red when lower is better), the threshold tone colours the value, the target is shown, a metric
 *          without a value shows a dash, a percent metric (0.67) reads "67%" with its change in points, and the note
 *          line shows its count when the KPI has a note and a value for it, and never otherwise.
 * Boundary: unit tier, jsdom; the web kit is DOM stand-ins, translation returns the key with its values, numbers print as
 *           is unless given Intl options (then in en).
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

/** Stands in for the permission constants gen emits in an app. */
const TestPermissions = {
  ordersOrderRead: "orders.order.read",
} as const;

vi.mock("@stackra/i18n/react", () => ({
  useTranslation: () => ({
    // `silentNote` stands in for a catalogue message that is empty for its count (`=0 {}`)
    t: (key: string, values?: Record<string, unknown>) =>
      key.endsWith(".silentNote")
        ? ""
        : values === undefined
          ? key
          : `${key} ${JSON.stringify(values)}`,
  }),
  useNumber: () => (value: number, options?: Intl.NumberFormatOptions) =>
    options === undefined ? String(value) : new Intl.NumberFormat("en", options).format(value),
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

const TILE = widget(WidgetStub, {
  key: "orders.order_kpis",
  query: OrderKpisQuery,
  display: WidgetDisplay.custom(),
});

afterEach(cleanup);

/** One KPI on the web, drawn from its metric and its note field. */
describe("KpiView", () => {
  /** A money metric shows in its currency, with a green relative change, its tone and target. */
  it("formats money, the change, the tone and the target", () => {
    const kpi = WidgetDisplay.kpi("revenue", { tones: [{ belowTarget: 1, tone: Tone.Warning }] });
    render(
      <KpiView
        widget={TILE}
        kpi={kpi}
        metric={{ value: 5000, previous: 4000, target: 10_000, series: null, currency: "USD" }}
      />,
    );
    expect(screen.getByText("USD 5000").getAttribute("data-tone")).toBe("warning");
    expect(screen.getByText(/panel::widgets.change/).getAttribute("data-tone")).toBe("success");
    expect(screen.getByText(/panel::widgets.target/).textContent).toContain("USD 10000");
  });

  /** The better direction flips the chip's colour, and a missing value is a dash. */
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

  /** A rate of 0.67 reads 67%, its target too, and its trend moves in points, not as a ratio. */
  it("formats a percent metric as a percent with a change in points", () => {
    render(
      <KpiView
        widget={TILE}
        kpi={WidgetDisplay.kpi("deliveredRate")}
        metric={{ value: 0.67, previous: 0.6, target: 0.95, series: null, format: "percent" }}
      />,
    );
    expect(screen.getByText("67%")).toBeTruthy();
    const change = screen.getByText(/panel::widgets.change_points/);
    expect(change.textContent).toContain('"change":"+7"');
    expect(change.getAttribute("data-tone")).toBe("success");
    expect(screen.queryByText(/panel::widgets.change /)).toBeNull();
    expect(screen.getByText(/panel::widgets.target/).textContent).toContain("95%");
  });

  /** The note field's count reaches the note's derived key, under a value or under the dash. */
  it("shows the note line with its count", () => {
    const kpi = WidgetDisplay.kpi("spend", { note: "spendOtherCurrencies" });
    const note = 'orders::widgets.order_kpis.spendOtherCurrencies {"count":2}';
    render(
      <KpiView
        widget={TILE}
        kpi={kpi}
        metric={{ value: 5000, previous: null, target: null, series: null, currency: "USD" }}
        note={2}
      />,
    );
    expect(screen.getByText(note).getAttribute("data-tone")).toBe("muted");
    cleanup();
    render(
      <KpiView
        widget={TILE}
        kpi={kpi}
        metric={{ value: null, previous: null, target: null, series: null }}
        note={2}
      />,
    );
    expect(screen.getByText(note)).toBeTruthy();
  });

  /** No note path, an empty note field or an empty message draws no line. */
  it("draws no note without a note path, a note value or a message", () => {
    const metric = { value: 5000, previous: null, target: null, series: null, currency: "USD" };
    render(<KpiView widget={TILE} kpi={WidgetDisplay.kpi("spend")} metric={metric} note={2} />);
    expect(screen.queryByText(/spendOtherCurrencies/)).toBeNull();
    cleanup();
    const kpi = WidgetDisplay.kpi("spend", { note: "spendOtherCurrencies" });
    render(<KpiView widget={TILE} kpi={kpi} metric={metric} note={null} />);
    expect(screen.queryByText(/spendOtherCurrencies/)).toBeNull();
    cleanup();
    const silent = WidgetDisplay.kpi("spend", { note: "silentNote" });
    render(<KpiView widget={TILE} kpi={silent} metric={metric} note={0} />);
    expect(screen.queryByText(/silentNote/)).toBeNull();
  });
});
