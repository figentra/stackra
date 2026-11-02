/**
 * Stackra file contract:
 * Purpose: `createOutput(setup)`, the `ConsoleOutput` a command writes through, over the run's `Renderer`: each
 *          method draws through the renderer, a table's or checklist's rows become the `--json` data unless the
 *          command sets its own, a failed checklist row is reported to the kernel, and `present` picks a component
 *          from the shape of typed data.
 * Boundary: draws nothing itself; the renderer gates `--json` and `--quiet`.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-016 to FR-022; STA-1966 spec FR-001, FR-008 to FR-011, FR-021 and FR-030.
 */
import type { CheckRow } from "#contracts/types/check-row.type";
import type { TableSpec } from "#contracts/types/table-spec.type";
import type { ConsoleOutput } from "#core/types/console-output.type";
import type { OutputSetup } from "#core/types/output-setup.type";

/** The statuses of a checklist row. */
const STATUSES = new Set<unknown>(["ok", "warn", "fail", "skip", "info"]);

/** A plain object (not an array, a date or a class instance). */
const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null && Object.getPrototypeOf(value) === Object.prototype;

/** Rows that read as checklist rows: a string name and a known status each. */
const isChecklist = (rows: readonly unknown[]): rows is readonly CheckRow[] =>
  rows.every(
    (row) => isRecord(row) && typeof row["name"] === "string" && STATUSES.has(row["status"]),
  );

/** A `TableSpec`, as opposed to a list of headers. */
const isTableSpec = (value: readonly string[] | TableSpec): value is TableSpec =>
  !Array.isArray(value);

/** A cell as text: nested values as JSON. */
const cellOf = (value: unknown) =>
  value === undefined || value === null
    ? ""
    : typeof value === "object"
      ? JSON.stringify(value)
      : value;

/** The output of one run. */
export function createOutput(setup: OutputSetup): ConsoleOutput {
  const { renderer, mode } = setup;
  let wrote = false;
  /** Marks the run as written to. */
  const touch = () => {
    if (wrote) return;
    wrote = true;
    setup.onWrite?.();
  };

  function table(headers: readonly string[], rows: readonly (readonly unknown[])[]): void;
  function table(spec: TableSpec): void;
  function table(
    first: readonly string[] | TableSpec,
    rows: readonly (readonly unknown[])[] = [],
  ): void {
    touch();
    if (!isTableSpec(first)) {
      renderer.table({
        columns: first.map((header, index) => ({ header, key: String(index) })),
        rows: rows.map((row) =>
          Object.fromEntries(row.map((cell, index) => [String(index), cell])),
        ),
      });
      return;
    }
    setup.onRows?.(first.rows);
    renderer.table(first);
  }

  const output: ConsoleOutput = {
    line: (text) => {
      touch();
      renderer.line(text);
    },
    info: (text) => {
      touch();
      renderer.message("info", text);
    },
    success: (text) => {
      touch();
      renderer.message("success", text);
    },
    warn: (text) => {
      touch();
      renderer.message("warn", text);
    },
    error: (text) => {
      touch();
      renderer.message("error", text);
    },
    title: (text) => {
      touch();
      renderer.title(text);
    },
    keyValue: (entries) => {
      touch();
      renderer.keyValue(entries);
    },
    list: (items) => {
      touch();
      renderer.list(items);
    },
    table,
    checklist: (checklist) => {
      touch();
      setup.onRows?.(checklist.rows);
      const summary = renderer.checklist(checklist);
      if (summary.failed > 0) setup.onFailed?.();
      return summary;
    },
    tree: (nodes, options) => {
      touch();
      renderer.tree(nodes, options?.expanded ?? mode.verbose);
    },
    problem: (problem) => {
      touch();
      renderer.problem(problem, mode.verbose);
    },
    present: (data) => {
      if (Array.isArray(data) && data.length > 0 && isChecklist(data))
        output.checklist({ rows: data });
      else if (Array.isArray(data) && data.length > 0 && data.every(isRecord)) {
        const keys = [...new Set(data.flatMap((row) => Object.keys(row)))];
        output.table({
          columns: keys.map((key) => ({
            header: key,
            key,
            ...(key === "status" ? { kind: "status" as const } : {}),
          })),
          rows: data.map((row) => Object.fromEntries(keys.map((key) => [key, cellOf(row[key])]))),
        });
      } else if (
        Array.isArray(data) &&
        data.every((item) => typeof item !== "object" || item === null)
      )
        output.list(data.map(String));
      else if (isRecord(data))
        output.keyValue(
          Object.fromEntries(Object.entries(data).map(([key, value]) => [key, cellOf(value)])),
        );
      else if (data !== undefined) output.json(data);
    },
    note: (text, tone = "info", title) => {
      touch();
      renderer.box(text, tone, title);
    },
    task: (label, work) => {
      touch();
      return renderer.task(label, work);
    },
    spinner: (message) => {
      touch();
      return renderer.spinner(message);
    },
    progress: (total, label) => {
      touch();
      return renderer.progress(total, label);
    },
    json: (data) => {
      if (mode.json) setup.onJson(data);
      else {
        touch();
        renderer.json(data);
      }
    },
    banner: () => renderer.banner(),
  };
  return output;
}
