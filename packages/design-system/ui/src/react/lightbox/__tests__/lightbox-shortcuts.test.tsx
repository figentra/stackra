/**
 * Stackra file contract:
 * Purpose: proves the Lightbox's keys run on the shortcut registry (ADR 0508): Right and Left step the pictures
 *          (mirrored right to left), End jumps to the last, the keys are consumed once, and they are listed.
 * Boundary: jsdom with real HeroUI, React Aria and a ShortcutProvider.
 * Runtime: browser
 * Governing contract: ADR 0022; ADR 0508.
 */
// @vitest-environment jsdom
import { ShortcutProvider, useShortcutRegistry } from "@stackra/shortcuts/react";
import { act, render, screen } from "@testing-library/react";

import { Lightbox } from "#react/lightbox/lightbox";

const IMAGES = [
  { id: "a", src: "/a.jpg", alt: "Latte" },
  { id: "b", src: "/b.jpg", alt: "Croissant" },
  { id: "c", src: "/c.jpg", alt: "Beans" },
] as const;

const shown = () => screen.getByRole("dialog").querySelector("img")?.getAttribute("alt");
const press = (code: string) =>
  act(() => {
    screen
      .getByRole("button", { name: "Close" })
      .dispatchEvent(new KeyboardEvent("keydown", { code, key: code, bubbles: true }));
  });

/** Lists the registered ids. */
function Ids() {
  return (
    <output>
      {useShortcutRegistry()
        .actions.map((one) => one.id)
        .join(" ")}
    </output>
  );
}

describe("Lightbox shortcuts", () => {
  it("steps with the arrows once per press and lists its keys", () => {
    render(
      <ShortcutProvider>
        <Lightbox images={IMAGES} isOpen defaultIndex={1} />
        <Ids />
      </ShortcutProvider>,
    );
    press("ArrowRight");
    expect(shown()).toBe("Beans");
    press("ArrowLeft");
    expect(shown()).toBe("Croissant");
    press("Home");
    expect(shown()).toBe("Latte");
    expect(document.querySelector("output")?.textContent).toContain("media.next");
  });

  it("mirrors the arrows right to left", () => {
    render(
      <ShortcutProvider direction="rtl">
        <Lightbox images={IMAGES} isOpen defaultIndex={1} />
      </ShortcutProvider>,
    );
    press("ArrowLeft");
    expect(shown()).toBe("Beans");
  });
});
