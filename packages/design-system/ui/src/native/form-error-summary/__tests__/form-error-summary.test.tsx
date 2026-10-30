/**
 * Stackra file contract:
 * Purpose: proves the native FormErrorSummary draws nothing without errors, titles itself by the count, announces the
 *          title when it appears and again only on a new `submitCount`, and hands a pressed error's field to
 *          `onSelectError`.
 * Boundary: jsdom with React Native and the native Alert and Text replaced by stand-ins.
 * Runtime: react-native
 * Governing contract: ADR 0022 (test placement); ADR 0055 (forms); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { FormErrorSummary } from "#native/form-error-summary/form-error-summary";

const state = vi.hoisted(() => ({ announced: [] as string[] }));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement("div", null, props["children"] as ReactNode),
    Pressable: (props: Record<string, unknown>) =>
      createElement(
        "button",
        { type: "button", role: props["accessibilityRole"], onClick: props["onPress"] },
        props["children"] as ReactNode,
      ),
    AccessibilityInfo: {
      announceForAccessibility: (text: string) => state.announced.push(text),
    },
  };
});

vi.mock("#native/alert/alert", async () => {
  const { createElement } = await import("react");
  return {
    Alert: (props: Record<string, unknown>) =>
      createElement(
        "div",
        null,
        createElement("h2", null, props["title"] as ReactNode),
        props["actions"] as ReactNode,
      ),
  };
});

vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});

const ERRORS = [
  { field: "email", label: "Email", message: "Enter an email address" },
  { field: "phone", message: "Enter a phone number" },
];

describe("FormErrorSummary (native)", () => {
  beforeEach(() => {
    state.announced = [];
  });

  it("draws nothing without errors", () => {
    const { container } = render(<FormErrorSummary errors={[]} />);
    expect(container.innerHTML).toBe("");
    expect(state.announced).toEqual([]);
  });

  it("announces its title on appearance and on a new attempt, and selects a pressed field", () => {
    const onSelectError = vi.fn();
    const { rerender } = render(
      <FormErrorSummary errors={ERRORS} submitCount={1} onSelectError={onSelectError} />,
    );
    expect(screen.getByRole("heading").textContent).toBe("There are 2 problems");
    expect(state.announced).toEqual(["There are 2 problems"]);
    rerender(<FormErrorSummary errors={ERRORS.slice(1)} submitCount={1} />);
    expect(state.announced).toHaveLength(1);
    rerender(<FormErrorSummary errors={ERRORS} submitCount={2} onSelectError={onSelectError} />);
    expect(state.announced).toHaveLength(2);
    fireEvent.click(screen.getByRole("link", { name: "Email: Enter an email address" }));
    expect(onSelectError).toHaveBeenCalledWith("email");
  });
});
