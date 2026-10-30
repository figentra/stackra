/**
 * Stackra file contract:
 * Purpose: proves the web AvatarGroup is one named group of named avatars, shows `max` of them and a "+N" count named
 *          for the rest, shows no count when all fit, hands size to HeroUI and passes root props through.
 * Boundary: jsdom with real HeroUI; the theme CSS is not loaded, so the fan-out is checked by class only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); design-system gap inventory row 25.
 */
// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";

import { AvatarGroup } from "#react/avatar-group/avatar-group";

const STAFF = [
  { id: "1", name: "Ada Lovelace" },
  { id: "2", name: "ليلى أحمد" },
  { id: "3", name: "Grace Hopper" },
  { id: "4", name: "Omar Khaled" },
  { id: "5", name: "Mona Saleh" },
  { id: "6", name: "Alan Turing" },
];

describe("AvatarGroup (web)", () => {
  it("is a named group of up to max named avatars and a named +N count", () => {
    render(<AvatarGroup items={STAFF} max={3} label="Staff on shift" />);
    const group = screen.getByRole("group", { name: "Staff on shift" });
    const images = within(group).getAllByRole("img");
    expect(images.map((node) => node.getAttribute("aria-label"))).toEqual([
      "Ada Lovelace",
      "ليلى أحمد",
      "Grace Hopper",
      "3 more people",
    ]);
    expect(images[3]?.textContent).toBe("+3");
  });

  it("shows no count when every avatar fits, and defaults max to four", () => {
    const { rerender } = render(<AvatarGroup items={STAFF.slice(0, 2)} label="Assignees" />);
    expect(screen.getAllByRole("img")).toHaveLength(2);
    rerender(<AvatarGroup items={STAFF} label="Assignees" />);
    expect(screen.getAllByRole("img")).toHaveLength(5);
    expect(screen.getByRole("img", { name: "2 more people" })).toBeTruthy();
  });

  it("sizes the avatars, fans out on hover and passes root props through", () => {
    const { container } = render(
      <AvatarGroup
        items={STAFF}
        size="sm"
        label="Viewers"
        id="g"
        data-testid="g"
        className="mine"
      />,
    );
    const group = screen.getByTestId("g");
    expect(group.id).toBe("g");
    expect(group.className).toContain("mine");
    expect(group.className).toContain("hover:[--avatar-group-overlap:-0.25rem]");
    expect(container.querySelectorAll(".avatar--sm").length).toBeGreaterThan(0);
  });
});
