/**
 * Stackra file contract:
 * Purpose: proves the native ExportDialog's choices reach `onExport` (format, columns, scope, email delivery), that
 *          clearing every column disables the export, that the progress bar shows while the file is prepared
 *          (indeterminate, then the reported percentage) and the dialog cannot be dismissed meanwhile, that an email
 *          export announces the email done, and that an uncontrolled dialog opens from its default and closes on
 *          Cancel, with the description shown.
 * Boundary: React Native and the child components are recording stand-ins; `useUiText` echoes the key and its values.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
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
  bars: [] as Record<string, unknown>[],
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
vi.mock("#native/progress-bar/progress-bar", () => ({
  ProgressBar: (props: Record<string, unknown>) => {
    state.bars.push(props);
    return null;
  },
}));
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

/** The last rendered radio group named by the key `name`. */
const radio = (name: string): Record<string, unknown> =>
  [...state.radios].reverse().find((each) => each["label"] === `ui::export_dialog.${name}`) ?? {};
/** The last rendered button of `variant`. */
const button = (variant: string): Record<string, unknown> =>
  [...state.buttons].reverse().find((each) => each["variant"] === variant) ?? {};
/** Calls a stand-in's `onChange` with `value`. */
const change = (props: Record<string, unknown>, value: unknown): void =>
  act(() => (props["onChange"] as (next: unknown) => void)(value));

describe("ExportDialog flow (native)", () => {
  beforeEach(() => {
    state.radios = [];
    state.checks = [];
    state.buttons = [];
    state.modals = [];
    state.bars = [];
    state.said = [];
  });

  it("exports the chosen format, columns, scope and email delivery with progress", async () => {
    let finish: (() => void) | undefined;
    let report: ((fraction: number) => void) | undefined;
    const onExport = vi.fn(
      (_request: unknown, progress: (fraction: number) => void) =>
        new Promise<void>((done) => {
          report = progress;
          finish = done;
        }),
    );
    render(
      <ExportDialog
        isOpen
        formats={FORMATS}
        columns={COLUMNS}
        counts={{ selection: 2, all: 40 }}
        deliveries={["download", "email"]}
        onExport={onExport}
      />,
    );
    expect((radio("delivery")["options"] as { label: string }[])[1]?.label).toBe(
      "ui::export_dialog.email",
    );
    change(radio("format"), "xlsx");
    change(radio("scope"), "all");
    change(radio("delivery"), "email");
    change(state.checks.at(-1) ?? {}, []);
    expect(state.checks.at(-1)?.["isInvalid"]).toBe(true);
    expect(button("primary")["isDisabled"]).toBe(true);
    change(state.checks.at(-1) ?? {}, ["name"]);
    expect(button("primary")["isDisabled"]).toBe(false);

    await act(async () => {
      (button("primary")["onPress"] as () => void)();
    });
    expect(onExport.mock.calls[0]?.[0]).toEqual({
      format: "xlsx",
      columns: ["name"],
      scope: "all",
      delivery: "email",
    });
    expect(state.bars.at(-1)).toMatchObject({ isValueVisible: false });
    expect(state.bars.at(-1)).not.toHaveProperty("value");
    expect(state.modals.at(-1)?.["isDismissable"]).toBe(false);
    expect(radio("format")["isDisabled"]).toBe(true);
    act(() => report?.(0.42));
    expect(state.bars.at(-1)).toMatchObject({ value: 42, isValueVisible: true });
    await act(async () => {
      finish?.();
    });
    expect(state.said).toEqual(["ui::export_dialog.done_email"]);
    expect(button("primary")).toMatchObject({ startIcon: "check", isDisabled: true });
  });

  it("opens from its default, shows the description and closes on Cancel", () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <ExportDialog
        defaultOpen
        title="Export orders"
        description="Up to 10,000 rows"
        formats={FORMATS}
        counts={{ all: 3 }}
        onExport={() => undefined}
        onOpenChange={onOpenChange}
      />,
    );
    expect(state.modals.at(-1)).toMatchObject({ isOpen: true, label: "Export orders" });
    expect(container.textContent).toContain("Up to 10,000 rows");
    expect(state.radios.filter((each) => each["label"] === "ui::export_dialog.scope")).toEqual([]);
    act(() => (button("secondary")["onPress"] as () => void)());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(state.modals.at(-1)?.["isOpen"]).toBe(false);
    act(() => ((state.modals.at(-1) ?? {})["onOpenChange"] as (next: boolean) => void)(true));
    expect(state.modals.at(-1)?.["isOpen"]).toBe(true);
  });

  it("cannot export without a format", () => {
    render(<ExportDialog isOpen formats={[]} counts={{ all: 3 }} onExport={() => undefined} />);
    expect(button("primary")["isDisabled"]).toBe(true);
  });
});
