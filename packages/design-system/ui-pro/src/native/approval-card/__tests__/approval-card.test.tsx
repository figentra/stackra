/**
 * Stackra file contract:
 * Purpose: proves the native ApprovalCard shows the request, its status as a translated word, the summary, the input as
 *          JSON and the approver; offers reject, escalate (only with a handler) and approve while pending and calls
 *          their handlers; and drops the buttons once decided.
 * Boundary: React Native does not render in vitest: react-native and `@stackra/ui/native` are replaced by stand-ins
 *           that render plain DOM. No `I18nProvider` is mounted, so the status words are the English catalogue's.
 * Runtime: node
 * Governing contract: ADR 0360 (decisions 6 to 9); WCAG 2.2 SC 1.4.1; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { ApprovalCard } from "#native/approval-card/approval-card";

vi.mock("react-native", () => ({
  View: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@stackra/ui/native", async () => {
  const { formatMessage } = await import("@stackra/i18n");
  const { createElement } = await import("react");
  const part =
    (tag: string) =>
    ({ children }: { children?: ReactNode }) =>
      createElement(tag, null, children);
  return {
    // The real hook falls back to the English catalogue with no I18nProvider; the mock does the same.
    useCatalogueText:
      (english: Parameters<typeof formatMessage>[0]) =>
      (key: Parameters<typeof formatMessage>[1], values?: Parameters<typeof formatMessage>[2]) =>
        formatMessage(english, key, values, "en"),
    Card: Object.assign(part("section"), {
      Header: part("header"),
      Title: part("h3"),
      Content: part("div"),
    }),
    Chip: ({ children, tone }: { children?: ReactNode; tone: string }) => (
      <span data-testid="status" data-tone={tone}>
        {children}
      </span>
    ),
    Text: part("p"),
    Button: ({ children, onPress }: { children?: ReactNode; onPress?: () => void }) => (
      <button type="button" onClick={onPress}>
        {children}
      </button>
    ),
  };
});

/** Renders a card with spies for its handlers. */
const renderCard = (status: "pending" | "approved", withEscalate = true) => {
  const handlers = { onApprove: vi.fn(), onReject: vi.fn(), onEscalate: vi.fn() };
  render(
    <ApprovalCard
      title="Refund order #1042"
      summary="Returns 120.00 to the card"
      input={{ orderId: "ord_1" }}
      inputLabel="Input"
      approver="Needs a finance approver"
      status={status}
      onApprove={handlers.onApprove}
      onReject={handlers.onReject}
      {...(withEscalate ? { onEscalate: handlers.onEscalate } : {})}
      approveLabel="Approve"
      rejectLabel="Reject"
      escalateLabel="Escalate"
    />,
  );
  return handlers;
};

describe("ApprovalCard (native)", () => {
  it("shows the request, the status word, the input and the approver, and reports each button", () => {
    const handlers = renderCard("pending");
    expect(screen.getByRole("heading", { name: "Refund order #1042" })).toBeTruthy();
    expect(screen.getByTestId("status").textContent).toBe("Pending");
    expect(screen.getByTestId("status").dataset["tone"]).toBe("warning");
    expect(screen.getByText(/"orderId": "ord_1"/)).toBeTruthy();
    expect(screen.getByText("Needs a finance approver")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    fireEvent.click(screen.getByRole("button", { name: "Escalate" }));
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    expect(handlers.onReject).toHaveBeenCalledOnce();
    expect(handlers.onEscalate).toHaveBeenCalledOnce();
    expect(handlers.onApprove).toHaveBeenCalledOnce();
  });

  it("offers no escalate button without a handler", () => {
    renderCard("pending", false);
    expect(screen.queryByRole("button", { name: "Escalate" })).toBeNull();
  });

  it("drops the buttons once decided and shows the outcome", () => {
    renderCard("approved");
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByTestId("status").textContent).toBe("Approved");
  });
});
