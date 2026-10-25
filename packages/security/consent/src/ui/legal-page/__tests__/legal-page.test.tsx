/**
 * Stackra file contract:
 * Purpose: proves `LegalPage` shows the title, the version line with its values, and one paragraph per blank-line
 *          separated block, rendering markup in the text as text.
 * Boundary: unit tier, jsdom; `@stackra/ui/react` stand-ins and a translation that prints the key and its values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; owner round 3 #29.
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { LegalPage } from "#ui/legal-page/legal-page";

vi.mock(
  "@stackra/ui/react",
  async () => (await import("#ui/__tests__/ui-stand-ins.fixture")).UI_STAND_INS,
);
vi.mock("@stackra/i18n/react", () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) => `${key} ${JSON.stringify(values ?? {})}`,
  }),
}));

afterEach(() => {
  cleanup();
});

describe("LegalPage", () => {
  it("shows the title, the version line and the paragraphs as text", () => {
    const { container } = render(
      <LegalPage
        title="Privacy notice"
        version="2026-10"
        effectiveFrom="1 November 2026"
        body={"First paragraph.\n\n  <b>Second</b> paragraph.  \n\n\n"}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Privacy notice");
    expect(
      screen.getByText(
        'consent::ui.legal.version {"version":"2026-10","effectiveFrom":"1 November 2026"}',
      ),
    ).toBeTruthy();
    expect(screen.getByText("<b>Second</b> paragraph.")).toBeTruthy();
    expect(container.querySelector("b")).toBeNull();
    expect(container.querySelectorAll("p")).toHaveLength(3);
  });
});
