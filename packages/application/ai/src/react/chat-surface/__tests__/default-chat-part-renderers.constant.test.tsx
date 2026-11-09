/**
 * Stackra file contract:
 * Purpose: proves the default Tamo part renderers through `renderChatParts`: a table draws its headers and cells, a KPI
 *          its value, a question answers through `onAnswer` (and is read-only without it), suggestions send through
 *          `onSend`, each chart kind draws its captioned data table, an artifact is a file card that opens and
 *          downloads through the host with its id and version, a host renderer wins over the default, and a malformed
 *          part draws nothing without throwing.
 * Boundary: unit tier, jsdom, the real @stackra/ui components; Recharts measures nothing in jsdom, so a chart is proven
 *           by the data table it carries, as @stackra/ui's own chart tests do.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0504; ADR 0507.
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { UIDataTypes, UIMessagePart, UITools } from "ai";
import { vi } from "vitest";

import type { ChatPartOptions } from "#react/chat-surface/chat-part-options.type";
import { renderChatParts } from "#react/chat-surface/render-chat-parts.function";

/** One turn's parts, as the AI SDK types them. */
type Parts = readonly UIMessagePart<UIDataTypes, UITools>[];

/** Draws one Tamo data part of `kind` with `data`. */
const draw = (kind: string, data: unknown, options: Partial<ChatPartOptions> = {}) =>
  render(
    <>
      {renderChatParts([{ type: `data-tamo-${kind}`, data }] as unknown as Parts, {
        isWriting: false,
        ...options,
      })}
    </>,
  );

describe("defaultChatPartRenderers", () => {
  afterEach(cleanup);

  it("draws a table's headers and cells", () => {
    draw("table", {
      columns: [
        { id: "order", label: "Order" },
        { id: "total", label: "Total", type: "money" },
      ],
      rows: [{ order: "2048", total: 12.5 }, { order: "2049" }],
    });
    const table = screen.getByRole("grid", { name: "Order, Total" });
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent),
    ).toEqual(["Order", "Total"]);
    expect(within(table).getByText("2048")).toBeTruthy();
    expect(within(table).getByText("2049")).toBeTruthy();
    expect(within(table).getByText("12.50")).toBeTruthy();
  });

  it("draws a KPI's value in its format", () => {
    draw("kpi", {
      metrics: [
        { label: "Revenue", value: 1200, previous: 1000, format: "money", currency: "SAR" },
      ],
    });
    expect(screen.getByText("Revenue")).toBeTruthy();
    // Intl puts a no-break space after the currency code; the DOM text is normalised, the matcher must be too
    expect(screen.getByText(/SAR\s1,200\.00/)).toBeTruthy();
  });

  it("answers a question through onAnswer, and shows it read-only without it", () => {
    const question = {
      id: "q1",
      prompt: "Which branch?",
      choices: [
        { value: "olaya", label: "Olaya" },
        { value: "tahlia", label: "Tahlia" },
      ],
    };
    const onAnswer = vi.fn();
    draw("question", question, { onAnswer });
    act(() => fireEvent.click(screen.getByRole("radio", { name: "Tahlia" })));
    // one question is also the last, so its step button opens the summary
    act(() => fireEvent.click(screen.getByRole("button", { name: "Review answers" })));
    act(() => fireEvent.click(screen.getByRole("button", { name: "Send answers" })));
    expect(onAnswer).toHaveBeenCalledWith("q1", { q1: "tahlia" });
    cleanup();
    draw("question", question);
    expect(screen.getByText("Which branch?")).toBeTruthy();
    expect(screen.getByText("Olaya")).toBeTruthy();
    expect(screen.queryByRole("radio")).toBeNull();
  });

  it("sends a picked suggestion through onSend", () => {
    const onSend = vi.fn();
    draw("suggestions", { items: ["Show last month", 7] }, { onSend });
    fireEvent.click(screen.getByRole("button", { name: /Show last month/ }));
    expect(onSend).toHaveBeenCalledWith("Show last month");
  });

  it("draws an artifact as a file card that opens and downloads through the host", () => {
    const onOpenArtifact = vi.fn();
    const onDownloadArtifact = vi.fn();
    draw(
      "artifact",
      { artifactId: "art_1", name: "Open orders", kind: "csv", version: 2, bytes: 2048 },
      { onOpenArtifact, onDownloadArtifact },
    );
    fireEvent.click(screen.getByRole("button", { name: "Open orders.csv" }));
    expect(onOpenArtifact).toHaveBeenCalledWith("art_1", 2);
    fireEvent.click(screen.getByRole("button", { name: "Download Open orders.csv" }));
    expect(onDownloadArtifact).toHaveBeenCalledWith("art_1", 2);
  });

  it("draws each chart kind with its data table", () => {
    const rows = [
      { month: "Jan", sales: 10, units: 2 },
      { month: "Feb", sales: 12, units: 3 },
    ];
    for (const kind of ["bar", "line", "area", "pie", "donut", "scatter"]) {
      draw("chart", { kind, x: "month", series: [{ field: "sales", label: "Sales" }], rows });
      expect(screen.getAllByRole("table", { name: "Sales" }).length).toBeGreaterThan(0);
      cleanup();
    }
  });

  it("lets a host renderer win over the default", () => {
    const kpi = vi.fn(() => <p>host figures</p>);
    draw(
      "kpi",
      { metrics: [{ label: "Revenue", value: 1, format: "number" }] },
      { renderers: { kpi } },
    );
    expect(screen.getByText("host figures")).toBeTruthy();
    expect(screen.queryByText("Revenue")).toBeNull();
    expect(kpi).toHaveBeenCalledTimes(1);
  });

  it("draws nothing for a malformed part and never throws", () => {
    const parts = [
      { type: "data-tamo-table", data: { columns: "Order", rows: [] } },
      { type: "data-tamo-table", data: { columns: [{ id: 1 }], rows: [{}] } },
      {
        type: "data-tamo-chart",
        data: { kind: "radar", x: "m", series: [{ field: "s", label: "S" }], rows: [] },
      },
      { type: "data-tamo-kpi", data: { metrics: [{ label: 1, value: "x" }] } },
      { type: "data-tamo-question", data: { id: "q1" } },
      { type: "data-tamo-suggestions", data: { items: [1, null] } },
      { type: "data-tamo-widget_ref", data: { widgetKey: "orders.kpis" } },
      { type: "data-tamo-form", data: { actionKey: "orders.order.create", values: {} } },
      { type: "data-tamo-artifact", data: { artifactId: "art_1", name: "x", version: 0 } },
      { type: "data-tamo-artifact", data: { name: "x", kind: "csv", version: 1 } },
      { type: "data-tamo-kpi", data: null },
      { type: "data-tamo-question" },
    ] as unknown as Parts;
    const { container } = render(<>{renderChatParts(parts, { isWriting: false })}</>);
    expect(container.innerHTML).toBe("");
  });
});
