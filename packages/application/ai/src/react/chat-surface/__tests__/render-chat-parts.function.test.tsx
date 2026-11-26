/**
 * Stackra file contract:
 * Purpose: proves `renderChatParts` draws text and reasoning in order, turns a tool call that waits for approval into
 *          an ApprovalCard whose buttons answer with the approval id, draws a `data-tamo-<kind>` part through the
 *          registered renderer (over the default) with the turn's options, and draws nothing for an unknown or
 *          malformed part.
 * Boundary: unit tier, jsdom, the real @stackra/ui ApprovalCard and Text; Reasoning and Sources are DOM stand-ins, as in
 *           the ChatSurface test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0504; ADR 0507; ADR 0021.
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { UIDataTypes, UIMessagePart, UITools } from "ai";
import { vi } from "vitest";

import { renderChatParts } from "#react/chat-surface/render-chat-parts.function";

vi.mock("@stackra/ui/react", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const { createElement } = await import("react");
  return {
    ...actual,
    Reasoning: (props: {
      readonly summary?: string;
      readonly steps: readonly { readonly key: string; readonly content: string }[];
    }) =>
      createElement(
        "details",
        null,
        createElement("summary", null, props.summary),
        ...props.steps.map((step) => createElement("p", { key: step.key }, step.content)),
      ),
    Sources: (props: {
      readonly sources: readonly { readonly key: string; readonly title?: string }[];
    }) =>
      createElement(
        "ol",
        null,
        ...props.sources.map((source) => createElement("li", { key: source.key }, source.title)),
      ),
  };
});

/** One turn's parts, as the AI SDK types them. */
type Parts = readonly UIMessagePart<UIDataTypes, UITools>[];

describe("renderChatParts", () => {
  afterEach(cleanup);

  it("draws text and reasoning in order, one step per reasoning part", () => {
    const parts: Parts = [
      { type: "reasoning", text: "Looked up the order" },
      { type: "reasoning", text: "Checked the carrier" },
      { type: "text", text: "It ships Thursday." },
      { type: "source-url", sourceId: "a", url: "https://example.com/o/2048", title: "Order 2048" },
    ];
    const { container } = render(
      <>{renderChatParts(parts, { reasoningLabel: "Steps", isWriting: false })}</>,
    );
    expect(container.querySelectorAll("details")).toHaveLength(1);
    expect(screen.getByText("Checked the carrier")).toBeTruthy();
    expect(screen.getByText("It ships Thursday.")).toBeTruthy();
    expect(screen.getByText("Order 2048")).toBeTruthy();
    expect(container.textContent?.indexOf("Steps")).toBeLessThan(
      container.textContent?.indexOf("It ships Thursday.") ?? 0,
    );
  });

  it("asks for approval of a waiting tool call and answers with its approval id", () => {
    const onApprovalResponse = vi.fn();
    const parts: Parts = [
      {
        type: "tool-orders_order_cancel",
        toolCallId: "call-1",
        state: "approval-requested",
        input: { orderId: "2048", notify: true, lines: [1, 2] },
        approval: { id: "appr-1" },
      },
    ];
    render(
      <>
        {renderChatParts(parts, {
          onApprovalResponse,
          toolLabels: { orders_order_cancel: "Cancel order" },
          isWriting: false,
        })}
      </>,
    );
    expect(screen.getByRole("region", { name: "Cancel order" })).toBeTruthy();
    expect(screen.getByText("2048")).toBeTruthy();
    // only top-level text, number and yes or no values are listed
    expect(screen.queryByText("lines")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    expect(onApprovalResponse).toHaveBeenLastCalledWith("appr-1", true);
    fireEvent.click(screen.getByRole("button", { name: "Deny" }));
    expect(onApprovalResponse).toHaveBeenLastCalledWith("appr-1", false);
  });

  it("shows an answered approval without buttons", () => {
    const parts: Parts = [
      {
        type: "dynamic-tool",
        toolName: "refund",
        toolCallId: "call-2",
        state: "approval-responded",
        input: { amount: 10 },
        approval: { id: "appr-2", approved: false, reason: "Too large" },
      },
    ];
    render(<>{renderChatParts(parts, { isWriting: false })}</>);
    expect(screen.getByRole("region", { name: "refund" })).toBeTruthy();
    expect(screen.getByText("Denied")).toBeTruthy();
    expect(screen.getByText("Too large")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
  });

  it("draws a Tamo table through its registered renderer", () => {
    const table = vi.fn((data: { readonly rows: readonly unknown[] }) => (
      <p>{`${data.rows.length} rows`}</p>
    ));
    const part = {
      type: "data-tamo-table" as const,
      data: { columns: [{ id: "id", label: "Order" }], rows: [{ id: "2048" }, { id: "2049" }] },
    };
    render(<>{renderChatParts([part], { renderers: { table }, isWriting: false })}</>);
    expect(screen.getByText("2 rows")).toBeTruthy();
    expect(table).toHaveBeenCalledWith(
      part.data,
      part,
      expect.objectContaining({ isWriting: false }),
    );
    // the host's renderer wins over the default table
    expect(screen.queryByRole("grid")).toBeNull();
  });

  it("draws nothing for an unknown, unregistered or malformed part", () => {
    const parts = [
      { type: "data-tamo-chart", data: {} },
      { type: "data-other", data: { a: 1 } },
      { type: "data-tamo-constructor", data: {} },
      { type: "tool-x", toolCallId: "c", state: "approval-requested", input: null },
      { type: "file", mediaType: "image/png", url: "https://example.com/a.png" },
      { nope: true },
      null,
      42,
    ] as unknown as Parts;
    const { container } = render(
      <>{renderChatParts(parts, { renderers: { table: () => "table" }, isWriting: false })}</>,
    );
    expect(container.innerHTML).toBe("");
  });
});
