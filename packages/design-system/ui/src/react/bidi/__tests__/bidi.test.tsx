/**
 * Stackra file contract:
 * Purpose: proves the web Bidi isolates an inline run in a `<bdi>` (auto by default), sets a block's `dir`, gives
 *          React Aria a locale of a fixed block direction so `useDirection` inside follows it, leaves an `auto` block
 *          to the app, and passes its attributes through.
 * Boundary: jsdom with real React Aria.
 * Runtime: browser
 * Governing contract: design-system gap inventory row 1 (owner choice "P1 + P2 core", 2026-10-28); ADR 0022.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import { Bidi } from "#react/bidi/bidi";
import { useDirection } from "#react/bidi/use-direction";

/** Writes the direction it reads. */
function Probe() {
  return <output>{useDirection()}</output>;
}

describe("Bidi (web)", () => {
  it("isolates an inline run in a bdi, first strong by default", () => {
    const { container, rerender } = render(<Bidi>SKU-104</Bidi>);
    expect(container.querySelector("bdi")?.getAttribute("dir")).toBe("auto");
    rerender(<Bidi dir="ltr">+966 55 123 4567</Bidi>);
    expect(container.querySelector("bdi")?.getAttribute("dir")).toBe("ltr");
  });

  it("sets a block's direction for the text and for React Aria inside it", () => {
    const { container } = render(
      <I18nProvider locale="ar-SA">
        <Probe />
        <Bidi isBlock dir="ltr">
          <Probe />
        </Bidi>
      </I18nProvider>,
    );
    expect(container.querySelector("div")?.getAttribute("dir")).toBe("ltr");
    expect(screen.getAllByRole("status").map((node) => node.textContent)).toEqual(["rtl", "ltr"]);
  });

  it("leaves an auto block to the app's direction", () => {
    render(
      <I18nProvider locale="ar">
        <Bidi isBlock>
          <Probe />
        </Bidi>
      </I18nProvider>,
    );
    expect(screen.getByRole("status").textContent).toBe("rtl");
  });

  it("passes its attributes through", () => {
    render(
      <Bidi id="sku" className="font-mono" data-testid="run">
        A-1
      </Bidi>,
    );
    expect(screen.getByTestId("run").id).toBe("sku");
    expect(screen.getByTestId("run").className).toBe("font-mono");
  });
});
