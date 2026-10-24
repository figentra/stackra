/**
 * Stackra file contract:
 * Purpose: proves the native Header, Body and Footer are Views with their base gaps merged with the caller's class,
 *          that the footer is a row at the reading end, that a string child is wrapped in `Text` while an element child
 *          is left alone, and that View props pass through.
 * Boundary: React Native does not render in vitest, so react-native and Text are replaced by recording stand-ins that
 *           render plain DOM; what reaches them is checked, not how they draw.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0312; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-100
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import { ModalBody, ModalFooter, ModalHeader } from "#native/modal/modal-section";

/** The props each View stand-in was last handed, in render order. */
const received = vi.hoisted(() => ({ views: [] as Record<string, unknown>[] }));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      received.views.push(props);
      return createElement("div", { "data-testid": "view" }, props["children"] as ReactNode);
    },
  };
});

vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", { "data-testid": "text" }, props["children"] as ReactNode),
  };
});

describe("Modal sections (native)", () => {
  beforeEach(() => {
    received.views = [];
  });

  it.each([
    ["header", ModalHeader, "gap-1 pb-3"],
    ["body", ModalBody, "gap-3 py-2"],
    ["footer", ModalFooter, "flex-row items-center justify-end gap-2 pt-4"],
  ] as const)("draws the %s as a View with its base class", (_name, Section, base) => {
    render(<Section>x</Section>);
    expect(received.views[0]?.["className"]).toBe(base);
  });

  it("keeps the caller's class after the base class", () => {
    render(<ModalBody className="px-2">x</ModalBody>);
    expect(received.views[0]?.["className"]).toBe("gap-3 py-2 px-2");
  });

  it("wraps a string child in Text and leaves an element child as it is", () => {
    const { getAllByTestId, container, rerender } = render(<ModalBody>Hello</ModalBody>);
    expect(getAllByTestId("text")).toHaveLength(1);
    expect(getAllByTestId("text")[0]?.textContent).toBe("Hello");
    rerender(
      <ModalBody>
        <i data-testid="mine" />
      </ModalBody>,
    );
    expect(container.querySelector('[data-testid="text"]')).toBeNull();
    expect(container.querySelector('[data-testid="mine"]')).toBeTruthy();
  });

  it("passes View props through", () => {
    render(<ModalFooter testID="footer" accessibilityLabel="Actions" />);
    expect(received.views[0]).toMatchObject({ testID: "footer", accessibilityLabel: "Actions" });
  });
});
