/**
 * Stackra file contract:
 * Purpose: proves the native FileTrigger names and decorates its Button by source, opens the source's picker with the
 *          accepted types and multiple flag, hands back the picked files, ignores a cancel and is disabled where the
 *          picker module is missing.
 * Boundary: the Button and `pickerFor` are recording stand-ins; the Expo pickers themselves are not loaded.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); design-system gap inventory row 6.
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";

import { FileTrigger } from "#native/file-trigger/file-trigger";

const state = vi.hoisted(() => ({
  button: {} as Record<string, unknown>,
  source: "" as string,
  pick: null as null | ((options: unknown) => Promise<unknown[]>),
}));

vi.mock("#native/button/button", () => ({
  Button: (props: Record<string, unknown>) => {
    state.button = props;
    return null;
  },
}));
vi.mock("#native/file-trigger/picker-for.function", () => ({
  pickerFor: (source: string) => {
    state.source = source;
    return state.pick;
  },
}));

describe("FileTrigger (native)", () => {
  it("names and decorates the button by source", () => {
    state.pick = () => Promise.resolve([]);
    render(<FileTrigger source="camera" />);
    expect(state.button["children"]).toBe("Take a photo");
    expect(state.button["startIcon"]).toBe("camera");
    expect(state.button["variant"]).toBe("secondary");
    render(<FileTrigger>Attach receipt</FileTrigger>);
    expect(state.button["children"]).toBe("Attach receipt");
    expect(state.button["startIcon"]).toBe("upload");
  });

  it("opens the picker and hands back the picked files, ignoring a cancel", async () => {
    const file = { uri: "file:///stock.csv", name: "stock.csv" };
    const pick = vi.fn(() => Promise.resolve([file]));
    state.pick = pick;
    const onSelect = vi.fn();
    render(<FileTrigger acceptedFileTypes={["text/csv"]} allowsMultiple onSelect={onSelect} />);
    expect(state.source).toBe("files");
    await act(async () => (state.button["onPress"] as () => void)());
    expect(pick).toHaveBeenCalledWith({ types: ["text/csv"], multiple: true });
    expect(onSelect).toHaveBeenCalledWith([file]);
    pick.mockImplementation(() => Promise.resolve([]));
    await act(async () => (state.button["onPress"] as () => void)());
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("is disabled where the picker module is missing", () => {
    state.pick = null;
    render(<FileTrigger source="photos" />);
    expect(state.button["isDisabled"]).toBe(true);
  });
});
