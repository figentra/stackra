/**
 * Stackra file contract:
 * Purpose: `ConsoleOutput`, everything a command writes: messages, a title, key-value lines, lists, tables with
 *          status cells, checklists, trees, boxed notes, the problem screen, task lines, spinners, progress bars, JSON
 *          data, typed data presented by its shape, and the banner, in one layout for every product.
 * Boundary: a type only; `createOutput` implements it over the run's `Renderer`. Warnings and errors go to standard
 *           error; under `--json` the text components write nothing, and a table's or checklist's rows are the data
 *           unless the command sets its own.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-016, FR-018, FR-021 and FR-022; STA-1966 spec FR-008 to FR-011, FR-021 and
 *                     FR-030.
 */
import type { ChecklistSpec } from "#contracts/types/checklist-spec.type";
import type { ChecklistSummary } from "#contracts/types/checklist-summary.type";
import type { NoteTone } from "#contracts/types/note-tone.type";
import type { Problem } from "#contracts/types/problem.type";
import type { Progress } from "#contracts/types/progress.type";
import type { Spinner } from "#contracts/types/spinner.type";
import type { TableSpec } from "#contracts/types/table-spec.type";
import type { TreeNode } from "#contracts/types/tree-node.type";

/** What a command writes through. */
export interface ConsoleOutput {
  /** A plain line (empty by default). */
  readonly line: (text?: string) => void;

  /** An information line. */
  readonly info: (text: string) => void;

  /** A success line. */
  readonly success: (text: string) => void;

  /** A warning line, on standard error. */
  readonly warn: (text: string) => void;

  /** An error line, on standard error. */
  readonly error: (text: string) => void;

  /** A section title in the accent colour. */
  readonly title: (text: string) => void;

  /** `key ........ value` lines. */
  readonly keyValue: (entries: Readonly<Record<string, unknown>>) => void;

  /** A bulleted list. */
  readonly list: (items: readonly string[]) => void;

  /** A table: headers and rows of cells, or a `TableSpec` with status columns and groups. */
  readonly table: {
    (headers: readonly string[], rows: readonly (readonly unknown[])[]): void;
    (table: TableSpec): void;
  };

  /** Grouped status rows and the summary line; a failed row ends the run with exit code 1. */
  readonly checklist: (checklist: ChecklistSpec) => ChecklistSummary;

  /** A tree, one level of children deep unless `--verbose` (or `expanded`). */
  readonly tree: (nodes: readonly TreeNode[], options?: { readonly expanded?: boolean }) => void;

  /** The error screen for a problem the command reports without failing. */
  readonly problem: (problem: Problem) => void;

  /** Typed data by its shape: checklist rows as a checklist, records as a table, an object as key-value lines. */
  readonly present: (data: unknown) => void;

  /** A boxed note. */
  readonly note: (text: string, tone?: NoteTone, title?: string) => void;

  /** Runs `work` and writes `label ........ DONE` (or `FAIL`, rethrowing); returns what `work` returns. */
  readonly task: <T>(label: string, work: () => Promise<T> | T) => Promise<T>;

  /** Starts a spinner. */
  readonly spinner: (message: string) => Spinner;

  /** Starts a progress bar of `total` steps. */
  readonly progress: (total: number, label?: string) => Progress;

  /** Sets the `--json` data; without `--json`, writes it pretty-printed. */
  readonly json: (data: unknown) => void;

  /** Writes the theme's banner (terminal only, never under `--json` or `--quiet`). */
  readonly banner: () => void;
}
