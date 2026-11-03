/**
 * Stackra file contract:
 * Purpose: proves the AskAi is one link to the docs named by its label alone (the sample question and the key
 *          hint stay out of the name), that Tab reaches it, that the coming-soon note describes it until the gateway
 *          is live, and that it reads the same in right-to-left.
 * Boundary: unit tier, jsdom, the real @stackra/ui components; matchMedia is stubbed for the DesignSystemProvider.
 *           Nothing in the block moves, so there is no motion to reduce.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; STA-2041.
 */
// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from "@stackra/testing";
import { DesignSystemProvider } from "@stackra/ui/react";
import { cleanup, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { AskAi } from "#react/ask-ai/ask-ai";

describe("AskAi", () => {
  beforeAll(() => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    }));
  });
  afterEach(cleanup);

  it("is one link named by its label, described by the coming-soon note", () => {
    render(
      <AskAi
        label="Ask the docs"
        docsUrl="/docs/search"
        placeholder="How do I cancel an order?"
        comingSoonNote="Answers here are coming soon."
      />,
    );
    const link = screen.getByRole("link", { name: "Ask the docs" });
    expect(link.getAttribute("href")).toBe("/docs/search");
    expect(link.tabIndex).toBe(0);
    link.focus();
    expect(document.activeElement).toBe(link);
    const note = screen.getByText("Answers here are coming soon.");
    expect(link.getAttribute("aria-describedby")).toBe(note.id);
    expect(screen.getByText("How do I cancel an order?").getAttribute("aria-hidden")).toBe("true");
  });

  it("drops the note once the gateway is live", () => {
    const { container } = render(
      <AskAi
        label="Ask the docs"
        docsUrl="/docs/search"
        isComingSoon={false}
        comingSoonNote="Answers here are coming soon."
      />,
    );
    expect(screen.queryByText("Answers here are coming soon.")).toBeNull();
    expect(
      screen.getByRole("link", { name: "Ask the docs" }).hasAttribute("aria-describedby"),
    ).toBe(false);
    expect(container.querySelector("[data-coming-soon]")).toBeNull();
  });

  it("reads the same in right-to-left", () => {
    render(
      <DesignSystemProvider locale="ar" hasShortcutCheatSheet={false}>
        <AskAi label="اسأل التوثيق" docsUrl="/ar/docs/search" />
      </DesignSystemProvider>,
    );
    expect(document.documentElement.dir).toBe("rtl");
    expect(screen.getByRole("link", { name: "اسأل التوثيق" })).toBeTruthy();
  });
});
