/**
 * Stackra file contract:
 * Purpose: proves the native BarList names its list and reads each ranked row as "label, value".
 * Boundary: react-native is the DOM stand-in of `#testing/fakes/native-dom`; Text is a stand-in.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { BarList } from "#native/bar-list/bar-list";

vi.mock("react-native", async () => (await import("#testing/fakes/native-dom")).nativeDom);
vi.mock("#native/text/text", async () => (await import("#testing/fakes/text-dom")).textDom);

describe("BarList (native)", () => {
  it("reads each ranked row as label and value", () => {
    render(
      <BarList
        label="Top products"
        items={[
          { key: "a", label: "Dates", value: 12 },
          { key: "b", label: "Coffee", value: 30 },
        ]}
      />,
    );
    expect(screen.getByRole("list", { name: "Top products" })).toBeTruthy();
    expect(screen.getByLabelText("Coffee, 30")).toBeTruthy();
    expect(screen.getByLabelText("Dates, 12")).toBeTruthy();
  });
});
