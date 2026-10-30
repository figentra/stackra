/**
 * Stackra file contract:
 * Purpose: proves the native TagInput adds the tags in typed text once a comma arrives, hands them to the TagGroup,
 *          and announces a refused duplicate politely.
 * Boundary: react-native is the DOM stand-in of `#testing/fakes/native-dom`; the TagGroup records its props.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { TagInput } from "#native/tag-input/tag-input";

const seen = vi.hoisted(() => ({ items: [] as unknown[] }));

vi.mock("react-native", async () => (await import("#testing/fakes/native-dom")).nativeDom);
vi.mock("#native/text/text", async () => (await import("#testing/fakes/text-dom")).textDom);
vi.mock("#native/tag-group/tag-group", () => ({
  TagGroup: (props: { items: unknown[] }) => {
    seen.items = props.items;
    return null;
  },
}));

describe("TagInput (native)", () => {
  it("adds the tags once a comma arrives and announces a duplicate", () => {
    render(<TagInput label="Tags" defaultValue={["vip"]} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Tags" }), {
      target: { value: "VIP, Riyadh," },
    });
    expect(seen.items).toEqual([
      { id: "0", label: "vip" },
      { id: "1", label: "Riyadh" },
    ]);
    expect(screen.getByText("“VIP” is already added.").getAttribute("aria-live")).toBe("polite");
  });
});
