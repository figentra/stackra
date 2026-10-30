/**
 * Stackra file contract:
 * Purpose: proves the native DropZone adds a camera trigger with `allowsCamera`, leaves out picked files of a type it
 *          does not accept, and with `showPreviews` lists the files picked (an image with its URI as the preview) and
 *          removes one.
 * Boundary: React Native and the child components are recording stand-ins; a pick is the FileTrigger's `onSelect`
 *           called by hand.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave C).
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { PickedFile } from "#contracts/types/picked-file.type";
import { DropZone } from "#native/drop-zone/drop-zone";

const state = vi.hoisted(() => ({
  triggers: [] as Record<string, unknown>[],
  lists: [] as Record<string, unknown>[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement("div", null, props["children"] as ReactNode),
  };
});
vi.mock("#native/text/text", () => ({ Text: () => null }));
vi.mock("#native/icon/icon", () => ({ Icon: () => null }));
vi.mock("#native/file-trigger/file-trigger", () => ({
  FileTrigger: (props: Record<string, unknown>) => {
    state.triggers.push(props);
    return null;
  },
}));
vi.mock("#native/file-trigger/upload-list", () => ({
  UploadList: (props: Record<string, unknown>) => {
    state.lists.push(props);
    return null;
  },
}));

const PHOTO: PickedFile = { uri: "file:///shot.jpg", name: "shot.jpg", type: "image/jpeg" };
const SHEET: PickedFile = { uri: "file:///stock.csv", name: "stock.csv", type: "text/csv" };

/** Picks `files` through the last trigger of `source`. */
function pick(source: string | undefined, files: readonly PickedFile[]) {
  const trigger = [...state.triggers].reverse().find((each) => each["source"] === source);
  act(() =>
    (trigger?.["onSelect"] as ((picked: readonly PickedFile[]) => void) | undefined)?.(files),
  );
}

describe("DropZone (native)", () => {
  beforeEach(() => {
    state.triggers = [];
    state.lists = [];
  });

  it("adds a camera trigger and leaves out files it does not accept", () => {
    const onSelect = vi.fn();
    render(<DropZone allowsCamera acceptedFileTypes={["image/*"]} onSelect={onSelect} />);
    expect(state.triggers.map((each) => each["source"])).toEqual([undefined, "camera"]);
    pick(undefined, [SHEET]);
    expect(onSelect).not.toHaveBeenCalled();
    pick("camera", [PHOTO]);
    expect(onSelect).toHaveBeenCalledWith([PHOTO]);
  });

  it("lists the files picked and removes one", () => {
    const onFilesChange = vi.fn();
    render(<DropZone allowsMultiple showPreviews onFilesChange={onFilesChange} />);
    pick(undefined, [PHOTO, SHEET]);
    expect(onFilesChange).toHaveBeenLastCalledWith([PHOTO, SHEET]);
    const list = state.lists.at(-1) ?? {};
    expect(list["items"]).toEqual([
      {
        id: "1",
        name: "shot.jpg",
        size: undefined,
        status: "done",
        previewSrc: "file:///shot.jpg",
      },
      { id: "2", name: "stock.csv", size: undefined, status: "done" },
    ]);
    act(() => (list["onRemove"] as (id: string) => void)("1"));
    expect(onFilesChange).toHaveBeenLastCalledWith([SHEET]);
  });
});
