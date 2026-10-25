/**
 * Stackra file contract:
 * Purpose: proves the web ApprovalCard shows a pending request open with its summary, input and approver, calls the
 *          approve, reject and escalate handlers from their buttons, leaves out escalate without a handler, and drops
 *          the buttons once the request is decided, drawing the decided state.
 * Boundary: jsdom with real HeroUI Pro; the theme CSS is not loaded, so roles, text and data attributes are read.
 * Runtime: browser
 * Governing contract: ADR 0360 (decisions 6 to 9); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { ApprovalCard } from "#react/approval-card/approval-card";

const base = {
  title: "Refund order 1042",
  summary: "Refunds 120.00 to the customer's card.",
  input: { orderId: "ord_1042" },
  approver: "Needs a finance approver",
  approveLabel: "Approve",
  rejectLabel: "Reject",
  escalateLabel: "Escalate",
};

describe("ApprovalCard (web)", () => {
  it("shows a pending request open and calls each handler", () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();
    const onEscalate = vi.fn();
    render(
      <ApprovalCard
        {...base}
        status="pending"
        onApprove={onApprove}
        onReject={onReject}
        onEscalate={onEscalate}
      />,
    );
    expect(screen.getByText("Refunds 120.00 to the customer's card.")).toBeTruthy();
    expect(screen.getByText("Needs a finance approver")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    fireEvent.click(screen.getByRole("button", { name: "Escalate" }));
    expect(onApprove).toHaveBeenCalledOnce();
    expect(onReject).toHaveBeenCalledOnce();
    expect(onEscalate).toHaveBeenCalledOnce();
  });

  it("offers no escalate button without a handler", () => {
    render(<ApprovalCard {...base} status="pending" onApprove={vi.fn()} onReject={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Escalate" })).toBeNull();
  });

  it("drops the buttons once decided and draws the decided state", () => {
    const { container } = render(
      <ApprovalCard {...base} status="approved" onApprove={vi.fn()} onReject={vi.fn()} />,
    );
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
    expect(container.querySelector("[data-slot='chat-tool']")?.getAttribute("data-state")).toBe(
      "output-available",
    );
  });
});
