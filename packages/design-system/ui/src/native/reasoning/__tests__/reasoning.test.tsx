/**
 * Stackra file contract:
 * Purpose: proves the native Reasoning hands its summary to the Disclosure, lists its steps by name, and shimmers while
 *          it streams.
 * Boundary: react-native is the DOM stand-in of `#testing/fakes/native-dom`; Text, Shimmer and Disclosure are
 *           stand-ins (the Disclosure always shows its content).
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { createElement, type ReactNode } from "react";
import { render, screen } from "@testing-library/react";

import { Reasoning } from "#native/reasoning/reasoning";

vi.mock("react-native", async () => (await import("#testing/fakes/native-dom")).nativeDom);
vi.mock("#native/text/text", async () => (await import("#testing/fakes/text-dom")).textDom);
vi.mock("#native/shimmer/shimmer", () => ({
  Shimmer: () => createElement("i", { "data-testid": "shimmer" }),
}));
vi.mock("#native/disclosure/disclosure", () => ({
  Disclosure: (props: { title: ReactNode; children: ReactNode }) =>
    createElement("section", null, createElement("h3", null, props.title), props.children),
}));

const STEPS = [
  { key: "search", label: "Searched the menu", content: "Found 12 dishes." },
  { key: "pick", content: "Picked the three cheapest." },
];

describe("Reasoning (native)", () => {
  it("lists its steps under the summary", () => {
    render(<Reasoning steps={STEPS} summary="Thought for 4s" />);
    expect(screen.getByRole("heading").textContent).toBe("Thought for 4s");
    expect(screen.getByRole("list", { name: "Reasoning steps" }).textContent).toContain(
      "Picked the three cheapest.",
    );
  });

  it("shimmers while streaming", () => {
    render(<Reasoning steps={STEPS} isStreaming />);
    expect(screen.getByTestId("shimmer")).toBeTruthy();
  });
});
