/**
 * Stackra file contract:
 * Purpose: proves the native UploadList is a named list with each file's state, a named progress ring while
 *          uploading, retry and remove handing back ids, a success haptic only when a file moves into `done`, and a
 *          long-press preview (with a light haptic) only for a file with a `previewSrc`.
 * Boundary: React Native, Reanimated and the child components are recording stand-ins that render plain DOM.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); design-system gap inventory row 6.
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { UploadItem } from "#contracts/types/upload-item.type";
import { UploadList } from "#native/file-trigger/upload-list";

const state = vi.hoisted(() => ({
  views: [] as Record<string, unknown>[],
  pressables: [] as Record<string, unknown>[],
  buttons: [] as Record<string, unknown>[],
  rings: [] as Record<string, unknown>[],
  thumbnails: [] as Record<string, unknown>[],
  played: [] as string[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      state.views.push(props);
      return createElement("div", null, props["children"] as ReactNode);
    },
    Pressable: (props: Record<string, unknown>) => {
      state.pressables.push(props);
      return createElement("div", null, props["children"] as ReactNode);
    },
  };
});
vi.mock("react-native-reanimated", async () => {
  const { createElement } = await import("react");
  const chain = { springify: () => chain, reduceMotion: () => chain };
  return {
    default: {
      View: (props: Record<string, unknown>) =>
        createElement("div", null, props["children"] as ReactNode),
    },
    FadeIn: chain,
    ZoomIn: chain,
    ReduceMotion: { System: "system" },
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
vi.mock("#native/icon-button/icon-button", () => ({
  IconButton: (props: Record<string, unknown>) => {
    state.buttons.push(props);
    return null;
  },
}));
vi.mock("#native/progress-circle/progress-circle", () => ({
  ProgressCircle: (props: Record<string, unknown>) => {
    state.rings.push(props);
    return null;
  },
}));
vi.mock("#native/thumbnail/thumbnail", () => ({
  Thumbnail: (props: Record<string, unknown>) => {
    state.thumbnails.push(props);
    return null;
  },
}));
vi.mock("#native/haptics/haptics", () => ({
  haptics: { play: (kind: string) => state.played.push(kind) },
}));
vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ locale: "en" }),
}));

const FILES: UploadItem[] = [
  { id: "a", name: "invoice-1042.pdf", size: 2_516_582, status: "uploading", progress: 40 },
  { id: "b", name: "menu.jpg", status: "uploading", previewSrc: "file:///menu.jpg" },
  { id: "c", name: "stock.csv", status: "error" },
];

const reset = () => {
  state.views = [];
  state.pressables = [];
  state.buttons = [];
  state.rings = [];
  state.thumbnails = [];
  state.played = [];
};

describe("UploadList (native)", () => {
  beforeEach(reset);

  it("is a named list with each state and a named ring while uploading", () => {
    render(<UploadList items={FILES} />);
    expect(state.views[0]?.["accessibilityRole"]).toBe("list");
    expect(state.views[0]?.["accessibilityLabel"]).toBe("Uploads");
    expect(screen.getByText("2.4 MB")).toBeTruthy();
    expect(screen.getByText("Upload failed")).toBeTruthy();
    expect(state.rings.map((ring) => [ring["label"], ring["value"]])).toEqual([
      ["Uploading invoice-1042.pdf", 40],
      ["Uploading menu.jpg", undefined],
    ]);
  });

  it("hands back ids from retry and remove", () => {
    const onRetry = vi.fn();
    const onRemove = vi.fn();
    render(<UploadList items={FILES} onRetry={onRetry} onRemove={onRemove} />);
    const press = (label: string) =>
      ((state.buttons.find((props) => props["label"] === label) ?? {})["onPress"] as () => void)();
    press("Retry stock.csv");
    press("Remove menu.jpg");
    expect(onRetry).toHaveBeenCalledWith("c");
    expect(onRemove).toHaveBeenCalledWith("b");
    expect(
      state.buttons.filter((props) => String(props["label"]).startsWith("Retry")),
    ).toHaveLength(1);
  });

  it("plays a success haptic only when a file moves into done", () => {
    const { rerender } = render(<UploadList items={[{ id: "z", name: "z", status: "done" }]} />);
    expect(state.played).toEqual([]);
    rerender(<UploadList items={FILES} />);
    rerender(
      <UploadList
        items={FILES.map((item) => (item.id === "a" ? { ...item, status: "done" } : item))}
      />,
    );
    expect(state.played).toEqual(["success"]);
  });

  it("opens a preview on long press only for a file with a previewSrc", () => {
    render(<UploadList items={FILES} />);
    const rows = state.pressables.slice(0, 3);
    expect(rows[0]?.["onLongPress"]).toBeUndefined();
    expect(rows[1]?.["accessibilityHint"]).toBe("Long press to preview");
    const longPress = (rows[1] ?? {})["onLongPress"] as () => void;
    act(() => longPress());
    expect(state.played).toEqual(["light"]);
    expect(state.thumbnails.some((props) => props["alt"] === "Preview of menu.jpg")).toBe(true);
  });
});
