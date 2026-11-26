/**
 * Stackra file contract:
 * Purpose: proves the web ButtonLink is a real anchor drawn in the Button's classes (primary by default, the core
 *          variant as HeroUI's primary plus the theme's core class, the pill only when asked), takes focus from the
 *          keyboard, navigates through the nearest RouterProvider, and reads the same in right-to-left.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement); STA-2041.
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import { ButtonLink, RouterProvider } from "#react/index";

const anchor = (name: string) => screen.getByRole("link", { name });

describe("ButtonLink (web)", () => {
  it("is an anchor drawn as a primary button of the default shape when nothing is given", () => {
    render(<ButtonLink href="/docs">Read the docs</ButtonLink>);
    const link = anchor("Read the docs");
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("/docs");
    expect(link.classList.contains("button")).toBe(true);
    expect(link.classList.contains("button--primary")).toBe(true);
    expect(link.classList.contains("rounded-[var(--radius-pill)]")).toBe(false);
  });

  it("draws the core pill as the Button does, in the asked size", () => {
    render(
      <ButtonLink href="/docs" variant="core" shape="pill" size="lg" className="mine">
        Read the docs
      </ButtonLink>,
    );
    const link = anchor("Read the docs");
    for (const name of [
      "button--primary",
      "button--core",
      "button--lg",
      "rounded-[var(--radius-pill)]",
      "mine",
    ])
      expect(link.classList.contains(name)).toBe(true);
  });

  it("takes focus from the keyboard", () => {
    render(<ButtonLink href="/docs">Read the docs</ButtonLink>);
    const link = anchor("Read the docs");
    act(() => link.focus());
    expect(document.activeElement).toBe(link);
  });

  it("navigates an internal link through the nearest RouterProvider", () => {
    const navigate = vi.fn();
    render(
      <RouterProvider navigate={navigate} useHref={(href) => `/base${href}`}>
        <ButtonLink href="/docs">Read the docs</ButtonLink>
      </RouterProvider>,
    );
    expect(anchor("Read the docs").getAttribute("href")).toBe("/base/docs");
    act(() => anchor("Read the docs").click());
    expect(navigate).toHaveBeenCalledWith("/docs", undefined);
  });

  it("reads the same in right-to-left", () => {
    render(
      <I18nProvider locale="ar">
        <ButtonLink href="/docs">اقرأ التوثيق</ButtonLink>
      </I18nProvider>,
    );
    expect(anchor("اقرأ التوثيق").getAttribute("href")).toBe("/docs");
  });
});
