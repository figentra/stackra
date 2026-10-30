/**
 * Stackra file contract:
 * Purpose: proves the native AttachmentCard reads the name with its type and size as one element, pressable as a
 *          button only with `onOpen`, names its buttons with the file, shows an upload's bar and a failure's retry.
 * Boundary: React Native and the child components are recording stand-ins that render plain DOM.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave C).
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import { AttachmentCard } from "#native/attachment-card/attachment-card";

const state = vi.hoisted(() => ({
  pressables: [] as Record<string, unknown>[],
  buttons: [] as Record<string, unknown>[],
  bars: [] as Record<string, unknown>[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement("div", null, props["children"] as ReactNode),
    Pressable: (props: Record<string, unknown>) => {
      state.pressables.push(props);
      return createElement("div", null, props["children"] as ReactNode);
    },
  };
});
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});
vi.mock("#native/icon/icon", () => ({ Icon: () => null }));
vi.mock("#native/thumbnail/thumbnail", () => ({ Thumbnail: () => null }));
vi.mock("#native/icon-button/icon-button", () => ({
  IconButton: (props: Record<string, unknown>) => {
    state.buttons.push(props);
    return null;
  },
}));
vi.mock("#native/progress-bar/progress-bar", () => ({
  ProgressBar: (props: Record<string, unknown>) => {
    state.bars.push(props);
    return null;
  },
}));
vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ locale: "en" }),
}));

describe("AttachmentCard (native)", () => {
  beforeEach(() => {
    state.pressables = [];
    state.buttons = [];
    state.bars = [];
  });

  it("reads the name, type and size as one button and names its actions", () => {
    const onOpen = vi.fn();
    const { container } = render(
      <AttachmentCard
        name="invoice-1042.pdf"
        size={2_516_582}
        onOpen={onOpen}
        onDownload={() => undefined}
        onRemove={() => undefined}
      />,
    );
    expect(container.textContent).toContain("\u2068PDF\u2069 · \u20682.4 MB\u2069");
    expect(state.pressables[0]).toMatchObject({
      accessibilityLabel: "invoice-1042.pdf, \u2068PDF\u2069 · \u20682.4 MB\u2069",
      accessibilityRole: "button",
      onPress: onOpen,
    });
    expect(state.buttons.map((each) => each["label"])).toEqual([
      "Download invoice-1042.pdf",
      "Remove invoice-1042.pdf",
    ]);
  });

  it("is not a button without onOpen, and shows an upload's bar", () => {
    render(<AttachmentCard name="menu.jpg" progress={40} onDownload={() => undefined} />);
    expect(state.pressables[0]?.["accessibilityRole"]).toBeUndefined();
    expect(state.bars[0]).toMatchObject({ label: "Uploading", value: 40 });
    expect(state.buttons).toHaveLength(0);
  });

  it("offers a retry for a failed upload", () => {
    render(<AttachmentCard name="stock.csv" error="" onRetry={() => undefined} />);
    expect(state.pressables[0]?.["accessibilityLabel"]).toBe("stock.csv, Upload failed");
    expect(state.buttons.map((each) => each["label"])).toEqual(["Retry stock.csv"]);
  });
});
