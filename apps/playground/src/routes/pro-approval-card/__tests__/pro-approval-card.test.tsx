/**
 * Stackra file contract:
 * Purpose: proves the Approval card page sits at /pro-approval-card in the AI category, titles the page and the
 *          document, offers reject, escalate and approve on the pending card, and drops them once approved.
 * Boundary: jsdom with real HeroUI Pro; `matchMedia` and `ResizeObserver` are stubbed because jsdom has neither.
 * Runtime: browser
 * Governing contract: ADR 0360 (decisions 6 to 9); ADR 0022 (test placement).
 */
import { fireEvent, render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProApprovalCard } from "#src/routes/pro-approval-card/pro-approval-card";
import { ProApprovalCardRoute } from "#src/routes/pro-approval-card/pro-approval-card.route";

describe("ProApprovalCard", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-approval-card in the AI category, and titles the page and the document", () => {
    render(<ProApprovalCard />);
    expect(ProApprovalCardRoute.path).toBe("/pro-approval-card");
    expect(ProApprovalCardRoute.category).toBe("AI");
    expect(
      screen.getByRole("heading", { level: 1, name: ProApprovalCardRoute.title }),
    ).toBeTruthy();
    expect(document.title).toBe("Approval card · Stackra Playground");
  });

  it("decides the pending card with its buttons", () => {
    render(<ProApprovalCard />);
    expect(screen.getByRole("button", { name: "Escalate" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
  });
});
