/**
 * Stackra file contract:
 * Purpose: proves the web `Fab` dims the page behind an open speed dial with a scrim that closes the dial on a press,
 *          and draws no scrim for an inline Fab.
 * Boundary: jsdom with real HeroUI and Motion.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { Fab } from "#react/fab/fab";

const ACTIONS = [
  { id: "note", label: "Note", icon: "file" },
  { id: "photo", label: "Photo", icon: "image" },
] as const;

describe("Fab (web)", () => {
  it("opens the dial over a scrim that closes it", async () => {
    const { container } = render(<Fab label="Create" actions={ACTIONS} />);
    const scrim = () => container.querySelector('[data-slot="fab-scrim"]');
    expect(scrim()).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(scrim()?.getAttribute("aria-hidden")).toBe("true");
    fireEvent.click(scrim() as Element);
    expect(screen.getByRole("button", { name: "Create" }).getAttribute("aria-expanded")).toBe(
      "false",
    );
    await waitFor(() => expect(scrim()).toBeNull());
  });

  it("draws no scrim inline", () => {
    const { container } = render(
      <Fab label="Create" actions={ACTIONS} placement="inline" defaultOpen />,
    );
    expect(container.querySelector('[data-slot="fab-scrim"]')).toBeNull();
  });
});
