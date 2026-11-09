/**
 * Stackra file contract:
 * Purpose: proves the web ApprovalCard approves and denies while requested, shows only a status line once approved,
 *          denied or expired, and disables both buttons while the answer is being sent.
 * Boundary: jsdom with real HeroUI and React Aria; no run is answered, the callbacks are spies.
 * Runtime: browser
 * Governing contract: ADR 0507; ADR 0021; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { ApprovalCard } from "#react/approval-card/approval-card";

/** The input of the call under approval. */
const FIELDS = [{ label: "Order", value: "2048" }];

describe("ApprovalCard (web)", () => {
  it("approves or denies a requested call", () => {
    const onApprove = vi.fn();
    const onDeny = vi.fn();
    render(
      <ApprovalCard
        title="Cancel order"
        fields={FIELDS}
        risk="L3"
        status="requested"
        onApprove={onApprove}
        onDeny={onDeny}
      />,
    );
    expect(screen.getByRole("region", { name: "Cancel order" })).toBeTruthy();
    expect(screen.getByText("2048")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    expect(onApprove).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Deny" }));
    expect(onDeny).toHaveBeenCalledOnce();
  });

  it.each([
    ["approved", "Approved"],
    ["denied", "Denied"],
    ["expired", "Expired"],
  ] as const)("shows no buttons once %s", (status, word) => {
    render(
      <ApprovalCard
        fields={FIELDS}
        status={status}
        reason="Not today"
        onApprove={vi.fn()}
        onDeny={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Deny" })).toBeNull();
    expect(screen.getByText(word)).toBeTruthy();
    expect(screen.queryByText("Not today") !== null).toBe(status === "denied");
  });

  it("disables both buttons while the answer is being sent", () => {
    const onApprove = vi.fn();
    render(
      <ApprovalCard
        fields={FIELDS}
        status="requested"
        isPending
        onApprove={onApprove}
        onDeny={vi.fn()}
      />,
    );
    const approve = screen.getByRole("button", { name: "Approve" });
    expect(
      approve.hasAttribute("disabled") || approve.getAttribute("aria-disabled") === "true",
    ).toBe(true);
    fireEvent.click(approve);
    expect(onApprove).not.toHaveBeenCalled();
    const deny = screen.getByRole("button", { name: "Deny" });
    expect(deny.hasAttribute("disabled") || deny.getAttribute("aria-disabled") === "true").toBe(
      true,
    );
  });
});
