/**
 * Stackra file contract:
 * Purpose: proves `PortalContainer` sends both our overlays (Popover, Drawer) and HeroUI's own (the Select list) into
 *          its element, and leaves them on `document.body` when given none.
 * Boundary: jsdom with real HeroUI and React Aria; nothing is laid out, so how a frame draws the overlay is the
 *           playground's e2e suite's.
 * Runtime: browser
 * Governing contract: STA-1371 (live preview frames, 2026-10-29); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";

import { Button } from "#react/button/button";
import { PortalContainer } from "#react/design-system-provider/portal-container";
import { Drawer } from "#react/drawer/drawer";
import { Popover } from "#react/popover/popover";
import { Select } from "#react/select/select";

const press = (element: HTMLElement) => act(() => element.click());

/** A frame element in the document, as a preview frame is. */
const frameOf = () => {
  const frame = document.createElement("div");
  frame.dataset["testid"] = "frame";
  document.body.append(frame);
  return frame;
};

describe("PortalContainer (web)", () => {
  afterEach(() => {
    for (const frame of document.querySelectorAll("[data-testid=frame]")) frame.remove();
  });

  it("opens HeroUI's Select list inside its element", () => {
    const frame = frameOf();
    render(
      <PortalContainer container={frame}>
        <Select items={[{ id: "draft", label: "Draft" }]} label="Status" />
      </PortalContainer>,
    );
    press(screen.getByRole("button", { name: /Status/ }));
    expect(frame.contains(screen.getByRole("listbox"))).toBe(true);
  });

  it("opens a Popover and a Drawer inside its element", () => {
    const frame = frameOf();
    render(
      <PortalContainer container={frame}>
        <Popover trigger={<Button>Filters</Button>} title="Filter orders">
          Choose a status.
        </Popover>
        <Drawer defaultOpen label="Edit order">
          <Drawer.Body>Body</Drawer.Body>
        </Drawer>
      </PortalContainer>,
    );
    expect(frame.contains(screen.getByRole("dialog", { name: "Edit order" }))).toBe(true);
  });

  it("leaves overlays on the document body without an element", () => {
    const frame = frameOf();
    render(
      <PortalContainer container={null}>
        <Select items={[{ id: "draft", label: "Draft" }]} label="Status" />
      </PortalContainer>,
    );
    press(screen.getByRole("button", { name: /Status/ }));
    expect(frame.contains(screen.getByRole("listbox"))).toBe(false);
    expect(document.body.contains(screen.getByRole("listbox"))).toBe(true);
  });
});
