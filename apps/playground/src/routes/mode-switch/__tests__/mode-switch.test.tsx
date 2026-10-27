/**
 * Stackra file contract:
 * Purpose: proves the Mode switch page sits at /mode-switch, titles the page and the document, and reports the
 *          developer mode when the switch is turned on.
 * Boundary: jsdom with the real `@stackra/ui` web entry.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); STA-803.
 */
import { fireEvent, render, screen } from "@testing-library/react";

import { ModeSwitch } from "#src/routes/mode-switch/mode-switch";
import { ModeSwitchRoute } from "#src/routes/mode-switch/mode-switch.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

describe("ModeSwitch page", () => {
  it("sits at /mode-switch, and titles the page and the document", () => {
    render(<ModeSwitch />);
    expect(routePath(ModeSwitchRoute)).toBe("/mode-switch");
    expect(screen.getByRole("heading", { level: 1, name: ModeSwitchRoute.title })).toBeTruthy();
    expect(document.title).toBe("Mode switch · Stackra Playground");
  });

  it("reports developer mode once switched on", () => {
    render(<ModeSwitch />);
    expect(screen.getByRole("status").textContent).toBe("Current mode: normal");
    fireEvent.click(screen.getByRole("switch", { name: /Developer mode/ }));
    expect(screen.getByRole("status").textContent).toBe("Current mode: developer");
  });
});
