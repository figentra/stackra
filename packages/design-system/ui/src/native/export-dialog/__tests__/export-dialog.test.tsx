/**
 * Stackra file contract:
 * Purpose: proves the native ExportDialog offers the formats, the scopes with their counts (a zero count disabled, the
 *          narrowest with rows chosen), the columns and the deliveries; hands `onExport` the request; announces the
 *          done and closes after the tick; and stays open, announcing the failure, when the export fails.
 * Boundary: React Native and the child components are recording stand-ins; `useUiText` echoes the key and its values,
 *           so the test does not depend on the catalogue's English.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave C).
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import { ExportDialog } from "#native/export-dialog/export-dialog";

const state = vi.hoisted(() => ({
  radios: [] as Record<string, unknown>[],
  checks: [] as Record<string, unknown>[],
  buttons: [] as Record<string, unknown>[],
  modals: [] as Record<string, unknown>[],
  said: [] as string[],
}));

/** A stand-in that renders its children (hoisted, so the mock factories can use it). */
const passThrough = vi.hoisted(() => async () => {
  const { createElement } = await import("react");
  return (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
});

vi.mock("react-native", async () => ({
  ScrollView: await passThrough(),
  AccessibilityInfo: { announceForAccessibility: (text: string) => state.said.push(text) },
}));
vi.mock("#react/hooks/use-ui-text", () => ({
  useUiText:
    () =>
    (key: string, values?: Record<string, unknown>): string =>
      values === undefined ? key : `${key} ${JSON.stringify(values)}`,
}));
vi.mock("#native/modal/modal", async () => {
  const part = await passThrough();
  const root = (props: Record<string, unknown>) => {
    state.modals.push(props);
    return props["isOpen"] ? part(props) : null;
  };
  return {
    Modal: Object.assign(root, { Header: part, Title: part, Footer: part, Close: () => null }),
  };
});
vi.mock("#native/text/text", async () => ({ Text: await passThrough() }));
vi.mock("#native/progress-bar/progress-bar", () => ({ ProgressBar: () => null }));
vi.mock("#native/radio-group/radio-group", () => ({
  RadioGroup: (props: Record<string, unknown>) => {
    state.radios.push(props);
    return null;
  },
}));
vi.mock("#native/checkbox-group/checkbox-group", () => ({
  CheckboxGroup: (props: Record<string, unknown>) => {
    state.checks.push(props);
    return null;
  },
}));
vi.mock("#native/button/button", () => ({
  Button: (props: Record<string, unknown>) => {
    state.buttons.push(props);
    return null;
  },
}));

const FORMATS = [
  { value: "csv", label: "CSV" },
  { value: "xlsx", label: "Excel" },
];
const COLUMNS = [
  { value: "sku", label: "SKU" },
  { value: "name", label: "Name" },
];

/** The last rendered radio group named `label`. */
const radio = (label: string) =>
  [...state.radios].reverse().find((each) => each["label"] === label) ?? {};
/** The last rendered export button. */
const exportButton = () =>
  [...state.buttons].reverse().find((each) => each["variant"] === "primary") ?? {};

describe("ExportDialog (native)", () => {
  beforeEach(() => {
    state.radios = [];
    state.checks = [];
    state.buttons = [];
    state.modals = [];
    state.said = [];
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("offers formats, scopes with counts, columns and deliveries", () => {
    render(
      <ExportDialog
        isOpen
        formats={FORMATS}
        columns={COLUMNS}
        counts={{ selection: 3, filtered: 0, all: 120 }}
        deliveries={["download", "email"]}
        email="ops@figentra.com"
        onExport={() => undefined}
      />,
    );
    expect(state.modals[0]).toMatchObject({ motion: "slide-up" });
    expect(radio("ui::export_dialog.format")["value"]).toBe("csv");
    const scope = radio("ui::export_dialog.scope");
    expect(scope["value"]).toBe("selection");
    expect((scope["options"] as { isDisabled: boolean }[]).map((each) => each.isDisabled)).toEqual([
      false,
      true,
      false,
    ]);
    expect(state.checks.at(-1)?.["value"]).toEqual(["sku", "name"]);
    expect(
      (radio("ui::export_dialog.delivery")["options"] as { label: string }[])[1]?.label,
    ).toContain("ops@figentra.com");
  });

  it("exports the request, announces it and closes after the tick", async () => {
    vi.useFakeTimers();
    const onExport = vi.fn(() => Promise.resolve());
    const onOpenChange = vi.fn();
    render(
      <ExportDialog
        isOpen
        formats={FORMATS}
        counts={{ all: 10 }}
        onExport={onExport}
        onOpenChange={onOpenChange}
      />,
    );
    await act(async () => {
      (exportButton()["onPress"] as () => void)();
    });
    expect(onExport).toHaveBeenCalledWith(
      { format: "csv", columns: [], scope: "all", delivery: "download" },
      expect.any(Function),
    );
    expect(state.said).toEqual(["ui::export_dialog.done_download"]);
    expect(exportButton()["children"]).toBe("ui::export_dialog.done");
    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("stays open and announces a failure", async () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <ExportDialog
        isOpen
        formats={FORMATS}
        counts={{ all: 10 }}
        onExport={() => Promise.reject(new Error("offline"))}
        onOpenChange={onOpenChange}
      />,
    );
    await act(async () => {
      (exportButton()["onPress"] as () => void)();
    });
    expect(state.said).toEqual(["ui::export_dialog.failed"]);
    expect(container.textContent).toContain("ui::export_dialog.failed");
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
