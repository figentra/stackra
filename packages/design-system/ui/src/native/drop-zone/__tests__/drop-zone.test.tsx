/**
 * Stackra file contract:
 * Purpose: proves the native DropZone: an upload icon, a label (one file or several, from the catalogue unless given)
 *          and a line, over a FileTrigger handed the types, multiple and disabled states, whose picked files are
 *          reported; disabled dims the zone.
 * Boundary: React Native does not render in vitest, so it and the house FileTrigger, Icon and Text are recording
 *           stand-ins that render plain DOM.
 * Runtime: node
 * Governing contract: design-system gap inventory (file trigger); ADR 0302 (decision 3); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { DropZone } from "#native/drop-zone/drop-zone";

const state = vi.hoisted(() => ({
  trigger: {} as Record<string, unknown>,
  views: [] as Record<string, unknown>[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      state.views.push(props);
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
vi.mock("#native/file-trigger/upload-list", () => ({ UploadList: () => null }));
vi.mock("#native/file-trigger/file-trigger", async () => {
  const { createElement } = await import("react");
  return {
    FileTrigger: (props: Record<string, unknown>) => {
      state.trigger = props;
      return createElement("span", null, props["children"] as ReactNode);
    },
  };
});
vi.mock("#react/hooks/use-ui-text", () => ({ useUiText: () => (key: string) => key }));

beforeEach(() => {
  state.trigger = {};
  state.views.length = 0;
});

describe("DropZone (native)", () => {
  it("asks for one file by default and reports what is picked", () => {
    const onSelect = vi.fn();
    render(<DropZone onSelect={onSelect} />);
    expect(screen.getByText("ui::drop_zone.label_one")).toBeTruthy();
    expect(screen.getByText("ui::drop_zone.browse_one")).toBeTruthy();
    expect(state.trigger).toMatchObject({ allowsMultiple: false, isDisabled: false });
    expect(state.trigger).not.toHaveProperty("acceptedFileTypes");
    const files = [{ uri: "file:///a", name: "a" }];
    (state.trigger["onSelect"] as (picked: unknown) => void)(files);
    expect(onSelect).toHaveBeenCalledWith(files);
  });

  it("asks for several files of the given types, dimmed while disabled", () => {
    render(
      <DropZone
        allowsMultiple
        acceptedFileTypes={["image/png"]}
        isDisabled
        label="Photos"
        description="PNG only"
        className="x"
      />,
    );
    expect(screen.getByText("Photos")).toBeTruthy();
    expect(screen.getByText("PNG only")).toBeTruthy();
    expect(screen.getByText("ui::drop_zone.browse")).toBeTruthy();
    expect(state.trigger).toMatchObject({
      allowsMultiple: true,
      isDisabled: true,
      acceptedFileTypes: ["image/png"],
    });
    expect(String(state.views[0]?.["className"])).toContain("opacity-50");
    (state.trigger["onSelect"] as (picked: unknown) => void)([]);
  });

  it("names several files from the catalogue", () => {
    render(<DropZone allowsMultiple />);
    expect(screen.getByText("ui::drop_zone.label")).toBeTruthy();
  });
});
