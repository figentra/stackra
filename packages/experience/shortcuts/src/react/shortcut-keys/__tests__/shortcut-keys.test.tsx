/**
 * Stackra file contract:
 * Purpose: unit tests of `ShortcutKeys`: the server draws the non-Apple form, an Apple client draws glyphs, a chord
 *          draws one inner `<kbd>` per step, the spoken form is the image label, a shortcut class draws its declared
 *          binding, and a palette-only shortcut draws nothing.
 * Boundary: test only; react-dom/server for the server snapshot, Testing Library in jsdom for the client, with the
 *           `navigator` global stubbed per test.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; registry v3.1 R-66 (display is ours).
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";

import { Shortcut } from "#core/bases/shortcut.base";
import { ShortcutKeys } from "#react/shortcut-keys/shortcut-keys";

class OpenPaletteShortcut extends Shortcut({
  keys: "mod+k",
  group: "console::palette.group_app",
}) {
  run(): void {}
}

class SignOutShortcut extends Shortcut({ group: "console::palette.group_account" }) {
  run(): void {}
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ShortcutKeys", () => {
  it("renders the non-Apple form on the server", () => {
    expect(renderToString(<ShortcutKeys keys="mod+shift+l" className="ms-auto" />)).toBe(
      '<kbd class="ms-auto" role="img" aria-label="Control Shift L"><kbd>Ctrl+Shift+L</kbd></kbd>',
    );
  });

  it("draws Apple glyphs on an Apple client", () => {
    vi.stubGlobal("navigator", { platform: "MacIntel", userAgent: "" });
    render(<ShortcutKeys shortcut={OpenPaletteShortcut} />);
    const hint = screen.getByRole("img", { name: "Command K" });
    expect(hint.textContent).toBe("⌘K");
  });

  it("draws one step per chord step", () => {
    vi.stubGlobal("navigator", { platform: "Linux x86_64", userAgent: "" });
    render(<ShortcutKeys keys="g s" />);
    const hint = screen.getByRole("img", { name: "G, then S" });
    expect([...hint.querySelectorAll("kbd")].map((step) => step.textContent)).toEqual(["G", "S"]);
    expect(hint.textContent).toBe("G S");
  });

  it("draws nothing for a palette-only shortcut", () => {
    const { container } = render(<ShortcutKeys shortcut={SignOutShortcut} />);
    expect(container.innerHTML).toBe("");
  });

  it("throws on a binding that is not one", () => {
    expect(() => renderToString(<ShortcutKeys keys="mod+" />)).toThrow(RangeError);
  });
});
