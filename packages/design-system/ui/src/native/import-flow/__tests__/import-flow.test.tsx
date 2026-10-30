/**
 * Stackra file contract:
 * Purpose: proves the native ImportFlow: it maps each column to a field by name (one Select per column, a skip entry
 *          first, required fields starred, the sample as the description), warns while a required field is unmapped
 *          and holds the check until it is mapped, then shows the dry run (created, updated, skipped, failed, the
 *          issues or a no-issues line) with back and import, import held when nothing would change.
 * Boundary: React Native does not render in vitest, so it and the house Select, Stat, Button and Text are recording
 *           stand-ins that render plain DOM; what each is handed is checked.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 3.3.1 and 4.1.3; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { ImportFlow } from "#native/import-flow/import-flow";
import { ImportReview } from "#native/import-flow/import-review";

const state = vi.hoisted(() => ({
  selects: {} as Record<string, Record<string, unknown>>,
  stats: [] as Record<string, unknown>[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement("div", null, props["children"] as ReactNode),
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
          "data-loading": String(Boolean(props["isLoading"])),
          onClick: props["onPress"] as () => void,
        },
        props["children"] as ReactNode,
      ),
  };
});
vi.mock("#native/select/select", () => ({
  Select: (props: Record<string, unknown>) => {
    state.selects[props["label"] as string] = props;
    return null;
  },
}));
vi.mock("#native/stat/stat", () => ({
  Stat: (props: Record<string, unknown>) => {
    state.stats.push(props);
    return null;
  },
}));
vi.mock("#react/hooks/use-ui-text", () => ({
  useUiText:
    () =>
    (key: string, values?: Record<string, unknown>): string =>
      values === undefined ? key : `${key} ${JSON.stringify(values)}`,
}));

const FIELDS = [
  { key: "email", label: "Email", isRequired: true },
  { key: "name", label: "Name", aliases: ["Full name"] },
];
const choose = (column: string, key: string | null) => {
  const onChange = state.selects[column]?.["onChange"] as (key: string | null) => void;
  act(() => onChange(key));
};

beforeEach(() => {
  state.selects = {};
  state.stats.length = 0;
});

describe("ImportFlow (native)", () => {
  it("maps the columns by name, stars required fields and shows the sample", () => {
    render(
      <ImportFlow
        columns={["Mail", "Full name"]}
        sample={{ "Full name": "Ada" }}
        fields={FIELDS}
        onDryRun={vi.fn()}
        onImport={vi.fn()}
      />,
    );
    expect(state.selects["Full name"]).toMatchObject({
      value: "name",
      description: 'ui::import_flow.sample {"value":"Ada"}',
      isFullWidth: true,
    });
    expect(state.selects["Mail"]?.["value"]).toBe("__skip");
    expect(state.selects["Mail"]).not.toHaveProperty("description");
    expect(state.selects["Mail"]?.["items"]).toEqual([
      { id: "__skip", label: "ui::import_flow.skip" },
      { id: "email", label: "Email *" },
      { id: "name", label: "Name" },
    ]);
    expect(screen.getByRole("alert").textContent).toBe(
      'ui::import_flow.required_missing {"fields":"Email"}',
    );
    expect(screen.getByText("ui::import_flow.check")).toHaveProperty("disabled", true);
  });

  it("holds its own mapping, reports each change and checks the mapped file", () => {
    const onMappingChange = vi.fn();
    const onDryRun = vi.fn();
    render(
      <ImportFlow
        columns={["Mail", "Full name"]}
        fields={FIELDS}
        onMappingChange={onMappingChange}
        onDryRun={onDryRun}
        onImport={vi.fn()}
      />,
    );
    choose("Mail", "email");
    expect(onMappingChange).toHaveBeenLastCalledWith({ Mail: "email", "Full name": "name" });
    expect(screen.queryByRole("alert")).toBeNull();
    choose("Full name", "__skip");
    expect(onMappingChange).toHaveBeenLastCalledWith({ Mail: "email", "Full name": null });
    choose("Full name", null);
    fireEvent.click(screen.getByText("ui::import_flow.check"));
    expect(onDryRun).toHaveBeenCalledWith({ Mail: "email", "Full name": null });
  });

  it("shows the owner's mapping when controlled", () => {
    render(
      <ImportFlow
        columns={["A"]}
        fields={FIELDS}
        mapping={{ A: "email" }}
        isBusy
        onDryRun={vi.fn()}
        onImport={vi.fn()}
        className="wide"
      />,
    );
    expect(state.selects["A"]?.["value"]).toBe("email");
    expect(screen.getByText("ui::import_flow.check").dataset["loading"]).toBe("true");
  });

  it("reviews the dry run with back and import, importing the current mapping", () => {
    const onImport = vi.fn();
    const onBack = vi.fn();
    render(
      <ImportFlow
        columns={["Email"]}
        fields={FIELDS}
        dryRun={{ created: 2, updated: 1, failed: 0, issues: [] }}
        onDryRun={vi.fn()}
        onImport={onImport}
        onBack={onBack}
      />,
    );
    expect(state.stats.map((stat) => [stat["label"], stat["value"]])).toEqual([
      ["ui::import_flow.created", 2],
      ["ui::import_flow.updated", 1],
      ["ui::import_flow.failed", 0],
    ]);
    expect(screen.getByText("ui::import_flow.no_issues")).toBeTruthy();
    fireEvent.click(screen.getByText("ui::import_flow.back"));
    expect(onBack).toHaveBeenCalled();
    fireEvent.click(screen.getByText("ui::import_flow.import"));
    expect(onImport).toHaveBeenCalledWith({ Email: "email" });
  });

  it("holds import when nothing would change and drops back without onBack", () => {
    render(
      <ImportFlow
        columns={["Email"]}
        fields={FIELDS}
        dryRun={{ created: 0, updated: 0, failed: 1, issues: [] }}
        onDryRun={vi.fn()}
        onImport={vi.fn()}
      />,
    );
    expect(screen.getByText("ui::import_flow.import")).toHaveProperty("disabled", true);
    expect(screen.queryByText("ui::import_flow.back")).toBeNull();
  });
});

describe("ImportReview (native)", () => {
  it("lists each issue by row with its action, and words a finished import in the past", () => {
    render(
      <ImportReview
        result={{
          created: 1,
          updated: 0,
          skipped: 3,
          failed: 1,
          issues: [{ row: 4, field: "email", message: "Not an email" }],
        }}
        issuesAction={<em>download</em>}
        isDone
      />,
    );
    expect(state.stats.map((stat) => stat["label"])).toEqual([
      "ui::import_dialog.done_created",
      "ui::import_dialog.done_updated",
      "ui::import_dialog.done_skipped",
      "ui::import_dialog.done_failed",
    ]);
    expect(screen.getByRole("header").textContent).toBe("ui::import_flow.issues");
    expect(screen.getByText('ui::import_flow.row {"row":4}')).toBeTruthy();
    expect(screen.getByText("Not an email")).toBeTruthy();
    expect(screen.getByText("download")).toBeTruthy();
  });

  it("names a pending skip as skipped", () => {
    render(<ImportReview result={{ created: 1, updated: 0, skipped: 2, failed: 0, issues: [] }} />);
    expect(state.stats[2]?.["label"]).toBe("ui::import_dialog.skipped");
  });
});
