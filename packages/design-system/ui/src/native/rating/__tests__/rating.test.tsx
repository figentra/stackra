/**
 * Stackra file contract:
 * Purpose: proves the native Rating is a named radio group of stars that picks with a haptic, clears when
 *          `isClearable`, and read-only is one image naming the fraction.
 * Boundary: react-native is the DOM stand-in of `#testing/fakes/native-dom`; Icon, Text, haptics and the theme
 *           colours are stand-ins.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { Rating } from "#native/rating/rating";

const played = vi.hoisted(() => [] as string[]);

vi.mock("react-native", async () => (await import("#testing/fakes/native-dom")).nativeDom);
vi.mock("#native/text/text", async () => (await import("#testing/fakes/text-dom")).textDom);
vi.mock("heroui-native", () => ({ useThemeColor: () => ["orange", "grey"] }));
vi.mock("#native/icon/icon", () => ({ Icon: () => null }));
vi.mock("#native/haptics/haptics", () => ({
  haptics: { play: (kind: string) => played.push(kind) },
}));

describe("Rating (native)", () => {
  it("picks a star with a haptic and clears it when clearable", () => {
    const onChange = vi.fn();
    render(<Rating isClearable onChange={onChange} />);
    expect(screen.getByRole("radiogroup", { name: "Rating" })).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: "2 stars" }));
    expect(onChange).toHaveBeenLastCalledWith(2);
    expect(screen.getByRole("radio", { name: "2 stars" }).getAttribute("aria-checked")).toBe(
      "true",
    );
    fireEvent.click(screen.getByRole("radio", { name: "2 stars" }));
    expect(onChange).toHaveBeenLastCalledWith(0);
    expect(played).toEqual(["selection", "selection"]);
  });

  it("is one image when read-only", () => {
    render(<Rating value={4.5} isReadOnly />);
    expect(screen.getByRole("image", { name: "4.5 out of 5 stars" })).toBeTruthy();
    expect(screen.queryByRole("radio")).toBeNull();
  });
});
