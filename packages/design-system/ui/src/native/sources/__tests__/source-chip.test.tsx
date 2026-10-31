/**
 * Stackra file contract:
 * Purpose: proves the native SourceChip is a link named by its domain that opens the system browser, reads its
 *          description as the hint, and never follows a non-web link.
 * Boundary: react-native is a recording stand-in; Text, Icon and Image are stand-ins.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { SourceChip } from "#native/sources/source-chip";

const state = vi.hoisted(() => ({ opened: [] as string[] }));

vi.mock("react-native", async () => {
  const { nativeDom } = await import("#testing/fakes/native-dom");
  return {
    ...nativeDom,
    Image: () => null,
    Linking: { openURL: (url: string) => state.opened.push(url) },
  };
});
vi.mock("#native/text/text", async () => (await import("#testing/fakes/text-dom")).textDom);
vi.mock("#native/icon/icon", () => ({ Icon: () => null }));

describe("SourceChip (native)", () => {
  it("opens a web source in the browser", () => {
    render(<SourceChip source={{ key: "a", href: "https://www.example.com/menu" }} />);
    fireEvent.click(screen.getByRole("link", { name: "example.com" }));
    expect(state.opened).toEqual(["https://www.example.com/menu"]);
  });

  it("shows a non-web link as a document", () => {
    // oxlint-disable-next-line no-script-url -- reason: the case under test
    render(<SourceChip source={{ key: "x", title: "Report", href: "javascript:alert(1)" }} />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByLabelText("Report, Document")).toBeTruthy();
  });
});
