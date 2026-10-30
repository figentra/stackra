/**
 * Stackra file contract:
 * Purpose: proves the native ButtonGroup is one toolbar named by its label, laid out in a row or a column, that hands
 *          each button the group's variant, size and disabled state and squares its corners, and passes other
 *          children through untouched.
 * Boundary: React Native does not render in vitest, so View is a recording stand-in that renders plain DOM, and the
 *           buttons are plain recording components.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { ButtonGroup } from "#native/button-group/button-group";

const state = vi.hoisted(() => ({
  view: {} as Record<string, unknown>,
  buttons: [] as Record<string, unknown>[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      state.view = props;
      return createElement("div", null, props["children"] as ReactNode);
    },
  };
});

/** A button that records what the group hands it. */
function Probe(props: Record<string, unknown>) {
  state.buttons.push(props);
  return null;
}

beforeEach(() => {
  state.buttons.length = 0;
});

describe("ButtonGroup (native)", () => {
  it("is a horizontal toolbar that gives each button the secondary variant and square corners", () => {
    render(
      <ButtonGroup label="Align">
        <Probe className="first" />
        <Probe />
        plain
      </ButtonGroup>,
    );
    expect(state.view).toMatchObject({ accessibilityRole: "toolbar", accessibilityLabel: "Align" });
    expect(String(state.view["className"])).toContain("flex-row");
    expect(state.buttons).toEqual([
      { variant: "secondary", className: "rounded-none first" },
      { variant: "secondary", className: "rounded-none " },
    ]);
    expect(screen.getByText("plain")).toBeTruthy();
  });

  it("stacks vertically and hands down the size, variant and disabled state", () => {
    render(
      <ButtonGroup
        label="Zoom"
        orientation="vertical"
        size="sm"
        variant="ghost"
        isDisabled
        className="edge"
      >
        <Probe />
      </ButtonGroup>,
    );
    expect(String(state.view["className"])).toMatch(/^flex-col .* edge$/);
    expect(state.buttons[0]).toEqual({
      variant: "ghost",
      size: "sm",
      isDisabled: true,
      className: "rounded-none ",
    });
  });
});
