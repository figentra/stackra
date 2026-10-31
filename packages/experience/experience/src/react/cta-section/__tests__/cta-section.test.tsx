/**
 * Stackra file contract:
 * Purpose: proves the CtaSection reports its actions and hands the newsletter address to `onSubscribe`, then thanks.
 * Boundary: unit tier, jsdom, the real @stackra/ui components.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504.
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { CtaSection } from "#react/cta-section/cta-section";

describe("CtaSection", () => {
  afterEach(cleanup);

  it("reports an action", () => {
    const onAction = vi.fn();
    render(
      <CtaSection
        title="Open your shop"
        actions={[{ id: "start", label: "Start free" }]}
        onAction={onAction}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Start free" }));
    expect(onAction).toHaveBeenCalledWith("start");
  });

  it("subscribes and thanks", () => {
    const onSubscribe = vi.fn();
    render(
      <CtaSection
        title="News"
        newsletter={{ label: "Email", submit: "Subscribe", thanks: "Thanks for subscribing" }}
        onSubscribe={onSubscribe}
      />,
    );
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "sara@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Subscribe" }));
    expect(onSubscribe).toHaveBeenCalledWith("sara@example.com");
    expect(screen.getByRole("status").textContent).toBe("Thanks for subscribing");
  });
});
