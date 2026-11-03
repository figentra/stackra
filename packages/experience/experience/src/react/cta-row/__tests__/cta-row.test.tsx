/**
 * Stackra file contract:
 * Purpose: proves the CtaRow draws the primary as a real link in the core pill, copies the copy link's value
 *          and the command from buttons named by the page's words, reaches them in order from the keyboard, keeps the
 *          command left to right in Arabic, and draws everything at once at every motion level.
 * Boundary: unit tier, jsdom, the real @stackra/ui components; the clipboard and matchMedia are stand-ins, and the
 *           locale and the motion level come from `DesignSystemProvider`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; STA-2041.
 */
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { CtaRow } from "#react/cta-row/cta-row";

/** jsdom has no matchMedia; the provider and Motion read the system's scheme and motion from it. */
vi.stubGlobal("matchMedia", () => ({
  matches: false,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
}));

const writeText = vi.fn((_text: string) => Promise.resolve());

const ROW = (
  <CtaRow
    primary={{ label: "Read the docs", href: "/docs" }}
    copyLink={{ label: "Copy llms.txt", value: "https://stackra.dev/llms.txt" }}
    command="stackra create my-app"
  />
);

describe("CtaRow", () => {
  beforeEach(() => {
    writeText.mockClear();
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  });

  afterEach(cleanup);

  it("draws the primary as a link in the core pill", () => {
    render(ROW);
    const link = screen.getByRole("link", { name: "Read the docs" });
    expect(link.getAttribute("href")).toBe("/docs");
    expect(link.className).toContain("button--core");
    expect(link.className).toContain("rounded-[var(--radius-pill)]");
  });

  it("copies the link's value and the command", async () => {
    render(ROW);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy llms.txt" }));
    });
    expect(writeText).toHaveBeenCalledWith("https://stackra.dev/llms.txt");
    await act(async () => {
      fireEvent.click(screen.getAllByRole("button").at(-1) as HTMLElement);
    });
    expect(writeText).toHaveBeenLastCalledWith("stackra create my-app");
  });

  it("reaches the link, then the copy link, then the command from the keyboard", () => {
    render(ROW);
    const order = [
      screen.getByRole("link", { name: "Read the docs" }),
      ...screen.getAllByRole("button"),
    ];
    expect(order).toHaveLength(3);
    for (const [index, element] of order.entries()) {
      element.focus();
      expect(document.activeElement).toBe(element);
      const next = order[index + 1];
      if (next)
        expect(
          element.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
    }
  });

  it("keeps the command left to right in Arabic, with the prompt hidden from speech", () => {
    const { container } = render(
      <DesignSystemProvider locale="ar" hasShortcutCheatSheet={false}>
        {ROW}
      </DesignSystemProvider>,
    );
    const command = container.querySelector('[data-slot="cta-row-command"]');
    expect(command?.getAttribute("dir")).toBe("ltr");
    expect(command?.querySelector('[aria-hidden="true"]')?.textContent?.trim()).toBe("$");
  });

  it("draws everything at once below the full motion level", () => {
    render(
      <DesignSystemProvider motion="none" hasShortcutCheatSheet={false}>
        {ROW}
      </DesignSystemProvider>,
    );
    expect(screen.getByRole("link", { name: "Read the docs" })).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(2);
    expect(screen.getByText("stackra create my-app")).toBeTruthy();
  });
});
