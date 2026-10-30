/**
 * Stackra file contract:
 * Purpose: proves the native ImportDialog walks upload, match, review and import in a drawer: the step bar names the
 *          step and its place, a picked file is read and auto-mapped, the dry run is reviewed and its issues shared as
 *          CSV, the import shows its progress then the result, the drawer cannot be dismissed while importing, each
 *          failure is announced with a retry or back, and closing resets the walk; open state is owned or its own.
 * Boundary: React Native does not render in vitest, so it and the house Drawer, DropZone, ProgressBar, Link, Select,
 *           Stat, Button and Text are recording stand-ins that render plain DOM; what each is handed is checked.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 3.3.1 and 4.1.3; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { ImportDialog } from "#native/import-dialog/import-dialog";

const state = vi.hoisted(() => ({
  drawer: {} as Record<string, unknown>,
  dropZone: {} as Record<string, unknown>,
  bars: [] as Record<string, unknown>[],
  shared: [] as { message: string }[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement("div", null, props["children"] as ReactNode),
    Share: {
      share: (content: { message: string }) => Promise.resolve(state.shared.push(content)),
    },
  };
});
vi.mock("#native/drawer/drawer", async () => {
  const { createElement } = await import("react");
  const part = (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  return {
    Drawer: Object.assign(
      (props: Record<string, unknown>) => {
        state.drawer = props;
        return props["isOpen"] ? part(props) : null;
      },
      {
        Header: part,
        Title: part,
        Description: part,
        SubHeader: part,
        Body: part,
        Footer: part,
        Close: (props: Record<string, unknown>) =>
          createElement("i", { "data-testid": "close", title: props["label"] as string }),
      },
    ),
  };
});
vi.mock("#native/drop-zone/drop-zone", () => ({
  DropZone: (props: Record<string, unknown>) => {
    state.dropZone = props;
    return null;
  },
}));
vi.mock("#native/progress-bar/progress-bar", () => ({
  ProgressBar: (props: Record<string, unknown>) => {
    state.bars.push(props);
    return null;
  },
}));
vi.mock("#native/link/link", async () => {
  const { createElement } = await import("react");
  return {
    Link: (props: Record<string, unknown>) =>
      createElement("a", { href: props["href"] as string }, props["children"] as ReactNode),
  };
});
vi.mock("#native/select/select", () => ({ Select: () => null }));
vi.mock("#native/stat/stat", async () => {
  const { createElement } = await import("react");
  return {
    Stat: (props: Record<string, unknown>) =>
      createElement("span", null, `${String(props["label"])}=${String(props["value"])}`),
  };
});
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement(
        "span",
        { role: props["accessibilityRole"] as string },
        props["children"] as ReactNode,
      ),
  };
});
vi.mock("#native/button/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: Record<string, unknown>) =>
      createElement(
        "button",
        {
          type: "button",
          disabled: Boolean(props["isDisabled"]),
          onClick: props["onPress"] as () => void,
        },
        props["children"] as ReactNode,
      ),
  };
});
vi.mock("#react/hooks/use-ui-text", () => ({
  useUiText:
    () =>
    (key: string, values?: Record<string, unknown>): string =>
      values === undefined ? key : `${key} ${JSON.stringify(values)}`,
}));

const K = "ui::import_dialog.";
const FIELDS = [{ key: "email", label: "Email", isRequired: true }];
const FILE = { uri: "file:///a.csv", name: "a.csv" };
const DRY = {
  created: 2,
  updated: 0,
  failed: 1,
  issues: [{ row: 3, field: "email", message: "Bad" }],
};

const press = (text: string) => fireEvent.click(screen.getByText(text));
const flush = () => act(async () => {});
const pick = async (files = [FILE]) => {
  act(() => (state.dropZone["onSelect"] as (files: unknown[]) => void)(files));
  await flush();
};
const lastBar = () => state.bars.at(-1) ?? {};

/** Renders an open dialog with working callbacks, overridable. */
const open = (props: Partial<Parameters<typeof ImportDialog>[0]> = {}) => {
  const callbacks = {
    onRead: vi.fn(() => Promise.resolve({ columns: ["Email"], rowCount: 12 })),
    onDryRun: vi.fn(() => Promise.resolve(DRY)),
    onImport: vi.fn(
      (_mapping: unknown, progress: (fraction: number) => void) =>
        new Promise<undefined>((resolve) => {
          progress(0.5);
          setTimeout(() => resolve(undefined), 0);
        }),
    ),
    onOpenChange: vi.fn(),
  };
  render(<ImportDialog fields={FIELDS} defaultOpen {...callbacks} {...props} />);
  return { ...callbacks, ...props };
};

beforeEach(() => {
  state.drawer = {};
  state.dropZone = {};
  state.bars.length = 0;
  state.shared.length = 0;
});

describe("ImportDialog (native)", () => {
  it("starts closed and opens from the drawer, at the upload step", () => {
    const onOpenChange = vi.fn();
    render(
      <ImportDialog
        fields={FIELDS}
        onRead={vi.fn()}
        onDryRun={vi.fn()}
        onImport={vi.fn()}
        trigger={<b>Import</b>}
        onOpenChange={onOpenChange}
      />,
    );
    expect(state.drawer).toMatchObject({ isOpen: false, size: "lg", isDismissable: true });
    act(() => (state.drawer["onOpenChange"] as (next: boolean) => void)(true));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(state.drawer["isOpen"]).toBe(true);
    expect(screen.getByText(`${K}title`)).toBeTruthy();
    expect(screen.getByTestId("close").title).toBe(`${K}close`);
    expect(lastBar()).toMatchObject({
      label: `${K}step_upload`,
      valueLabel: `${K}step_of {"step":1,"total":4}`,
      value: 1,
      maxValue: 4,
    });
    expect(state.dropZone).toMatchObject({
      acceptedFileTypes: [".csv", ".xlsx", ".xls"],
      isDisabled: false,
    });
  });

  it("titles itself as asked, offers the template and cancels", () => {
    const { onOpenChange } = open({
      title: "People",
      description: "From a sheet",
      templateUrl: "https://a.example/t.csv",
      acceptedFileTypes: [".csv"],
    });
    expect(screen.getByText("People")).toBeTruthy();
    expect(screen.getByText("From a sheet")).toBeTruthy();
    expect(screen.getByText(`${K}template`).getAttribute("href")).toBe("https://a.example/t.csv");
    expect(state.dropZone["acceptedFileTypes"]).toEqual([".csv"]);
    press(`${K}cancel`);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(state.drawer["isOpen"]).toBe(false);
  });

  it("ignores an empty pick and shows reading while the file loads", async () => {
    let finish: ((preview: { columns: string[] }) => void) | undefined;
    const { onRead } = open({
      onRead: vi.fn(
        () =>
          new Promise<{ columns: string[] }>((resolve) => {
            finish = resolve;
          }),
      ),
    });
    await pick([]);
    expect(onRead).not.toHaveBeenCalled();
    act(() => (state.dropZone["onSelect"] as (files: unknown[]) => void)([FILE]));
    expect(state.dropZone["isDisabled"]).toBe(true);
    expect(state.bars.some((bar) => bar["label"] === `${K}reading`)).toBe(true);
    await act(async () => finish?.({ columns: ["Email"] }));
    expect(screen.getByText("a.csv")).toBeTruthy();
  });

  it("announces a failed read and stays on upload", async () => {
    open({ onRead: vi.fn(() => Promise.reject(new Error("bad"))) });
    await pick();
    expect(screen.getByRole("alert").textContent).toBe(`${K}read_failed`);
    expect(lastBar()["label"]).toBe(`${K}step_upload`);
  });

  it("walks match, review and import, sharing the issues and finishing with the dry run", async () => {
    const { onRead, onDryRun, onImport, onOpenChange } = open();
    await pick();
    expect(onRead).toHaveBeenCalledWith(FILE);
    expect(screen.getByText(`a.csv · ${K}file_rows {"count":12}`)).toBeTruthy();
    expect(lastBar()["label"]).toBe(`${K}step_match`);

    press(`${K}back`);
    expect(lastBar()["label"]).toBe(`${K}step_upload`);
    await pick();

    press("ui::import_flow.check");
    await flush();
    expect(onDryRun).toHaveBeenCalledWith({ Email: "email" });
    expect(screen.getByText("ui::import_flow.created=2")).toBeTruthy();
    press(`${K}download_errors`);
    expect(state.shared[0]?.message).toContain("Bad");

    press("ui::import_flow.back");
    expect(lastBar()["label"]).toBe(`${K}step_match`);
    press("ui::import_flow.check");
    await flush();

    press("ui::import_flow.import");
    expect(state.drawer).toMatchObject({ isDismissable: false, isKeyboardDismissDisabled: true });
    expect(lastBar()).toMatchObject({ label: `${K}importing`, value: 50, isValueVisible: true });
    await act(
      () =>
        new Promise((resolve) => {
          setTimeout(resolve, 5);
        }),
    );
    expect(onImport).toHaveBeenCalled();
    expect(screen.getAllByRole("header")[0]?.textContent).toBe(`${K}done_title`);
    expect(screen.getByText(`${K}done_created=2`)).toBeTruthy();

    press(`${K}done`);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("holds the check until required fields are mapped", async () => {
    open({ onRead: vi.fn(() => Promise.resolve({ columns: ["Other"] })) });
    await pick();
    expect(screen.getByText("a.csv")).toBeTruthy();
    expect(screen.getByText("ui::import_flow.check")).toHaveProperty("disabled", true);
  });

  it("announces a failed check", async () => {
    open({ onDryRun: vi.fn(() => Promise.reject(new Error("no"))) });
    await pick();
    press("ui::import_flow.check");
    await flush();
    expect(screen.getByRole("alert").textContent).toBe(`${K}check_failed`);
  });

  it("holds import when nothing would change", async () => {
    open({
      onDryRun: vi.fn(() => Promise.resolve({ created: 0, updated: 0, failed: 0, issues: [] })),
    });
    await pick();
    press("ui::import_flow.check");
    await flush();
    expect(screen.getByText("ui::import_flow.import")).toHaveProperty("disabled", true);
  });

  it("offers retry and back after a failed import, and keeps the importer's own result", async () => {
    const onImport = vi
      .fn()
      .mockRejectedValueOnce(new Error("down"))
      .mockResolvedValueOnce({ created: 7, updated: 0, failed: 0, issues: [] });
    open({ onImport });
    await pick();
    press("ui::import_flow.check");
    await flush();
    press("ui::import_flow.import");
    expect(lastBar()["isValueVisible"]).toBe(false);
    await flush();
    expect(screen.getByRole("alert").textContent).toBe(`${K}import_failed`);
    expect(state.drawer["isDismissable"]).toBe(true);
    press(`${K}retry`);
    await flush();
    expect(screen.getByText(`${K}done_created=7`)).toBeTruthy();
  });

  it("goes back to review from a failed import", async () => {
    open({ onImport: vi.fn(() => Promise.reject(new Error("down"))) });
    await pick();
    press("ui::import_flow.check");
    await flush();
    press("ui::import_flow.import");
    await flush();
    press(`${K}back`);
    expect(lastBar()["label"]).toBe(`${K}step_review`);
  });

  it("follows the owner's open state", () => {
    const onOpenChange = vi.fn();
    render(
      <ImportDialog
        fields={FIELDS}
        isOpen
        onOpenChange={onOpenChange}
        onRead={vi.fn()}
        onDryRun={vi.fn()}
        onImport={vi.fn()}
      />,
    );
    press(`${K}cancel`);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(state.drawer["isOpen"]).toBe(true);
  });
});
