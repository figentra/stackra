/**
 * Stackra file contract:
 * Purpose: proves the native Sources counts its sources in the toggle and lists one chip per source.
 * Boundary: react-native is the DOM stand-in of `#testing/fakes/native-dom`; Text, Disclosure and the chip are
 *           stand-ins.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { createElement, type ReactNode } from "react";
import { render, screen } from "@testing-library/react";

import { Sources } from "#native/sources/sources";

vi.mock("react-native", async () => (await import("#testing/fakes/native-dom")).nativeDom);
vi.mock("#native/text/text", async () => (await import("#testing/fakes/text-dom")).textDom);
vi.mock("#native/sources/source-mark", () => ({ SourceMark: () => null }));
vi.mock("#native/sources/source-chip", () => ({
  SourceChip: () => createElement("i", { "data-testid": "chip" }),
}));
vi.mock("#native/disclosure/disclosure", () => ({
  Disclosure: (props: { title: ReactNode; children: ReactNode }) =>
    createElement("section", null, createElement("h3", null, props.title), props.children),
}));

describe("Sources (native)", () => {
  it("counts the sources and lists a chip each", () => {
    render(<Sources sources={[{ key: "a", title: "Menu" }, { key: "b", title: "Q3.pdf" }]} />);
    expect(screen.getByRole("heading").textContent).toBe("2 sources");
    expect(screen.getAllByTestId("chip")).toHaveLength(2);
  });
});
