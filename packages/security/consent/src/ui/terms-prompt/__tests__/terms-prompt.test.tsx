/**
 * Stackra file contract:
 * Purpose: proves `TermsPrompt` lists each document with a link, calls `onAccept` on the button, shows the pending
 *          state, and renders nothing with no document.
 * Boundary: unit tier, jsdom; `@stackra/ui/react` stand-ins and a translation that returns the key.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; owner round 3 #29.
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { TermsPrompt } from "#ui/terms-prompt/terms-prompt";

vi.mock(
  "@stackra/ui/react",
  async () => (await import("#ui/__tests__/ui-stand-ins.fixture")).UI_STAND_INS,
);
vi.mock("@stackra/i18n/react", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

afterEach(() => {
  cleanup();
});

const documents = [
  { key: "terms", version: "2026-10", title: "Terms of service", href: "/legal/terms" },
  { key: "privacy", version: "2026-10", title: "Privacy notice", href: "/legal/privacy" },
];

describe("TermsPrompt", () => {
  it("lists the documents and accepts them", () => {
    const onAccept = vi.fn();
    render(<TermsPrompt documents={documents} onAccept={onAccept} isLoading />);
    expect(screen.getByText("Privacy notice").getAttribute("href")).toBe("/legal/privacy");
    const accept = screen.getByText("consent::ui.terms.accept");
    expect(accept.getAttribute("aria-busy")).toBe("true");
    fireEvent.click(accept);
    expect(onAccept).toHaveBeenCalledOnce();
  });

  it("renders nothing with no document", () => {
    const { container } = render(<TermsPrompt documents={[]} onAccept={() => undefined} />);
    expect(container.innerHTML).toBe("");
  });
});
