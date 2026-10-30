/**
 * Stackra file contract:
 * Purpose: proves the native ContextualHelp hands the Popover a small ghost IconButton named by `label` (a question
 *          mark for `help`, the "i" for `info`), the title, the content and the other popover props.
 * Boundary: React Native does not render in vitest, so the Popover and IconButton are replaced by recording stand-ins.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0312; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

import { ContextualHelp } from "#native/contextual-help/contextual-help";

const received = vi.hoisted(() => ({ popover: {} as Record<string, unknown> }));

vi.mock("@stackra/icons/native/lucide-icons", () => ({ CircleQuestionMark: () => null }));
vi.mock("#native/icon-button/icon-button", () => ({ IconButton: () => null }));
vi.mock("#native/popover/popover", async () => {
  const { createElement } = await import("react");
  return {
    Popover: (props: Record<string, unknown>) => {
      received.popover = props;
      return createElement("div", null, props["children"] as ReactNode);
    },
  };
});

const triggerProps = () =>
  (received.popover["trigger"] as ReactElement<Record<string, unknown>>).props;

describe("ContextualHelp (native)", () => {
  it("hands the popover a small ghost button named by the label, the title and the content", () => {
    const { getByText } = render(
      <ContextualHelp label="About the shift float" title="Shift float" placement="top">
        The cash the drawer starts with.
      </ContextualHelp>,
    );
    expect(getByText("The cash the drawer starts with.")).toBeTruthy();
    expect(received.popover).toMatchObject({ title: "Shift float", placement: "top" });
    expect(triggerProps()).toMatchObject({
      label: "About the shift float",
      variant: "ghost",
      size: "sm",
    });
    expect(typeof triggerProps()["icon"]).toBe("object");
  });

  it("draws the i for info and leaves the heading out without a title", () => {
    render(
      <ContextualHelp label="Help" variant="info">
        Text
      </ContextualHelp>,
    );
    expect(triggerProps()["icon"]).toBe("info");
    expect(received.popover).not.toHaveProperty("title");
  });
});
