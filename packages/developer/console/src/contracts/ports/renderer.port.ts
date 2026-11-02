/**
 * Stackra file contract:
 * Purpose: the `Renderer` port: everything one run draws, from typed data: messages, a title, key-value lines, lists,
 *          tables with status cells, checklists, trees, boxes, the problem screen, the banner, help, the command list,
 *          tasks, spinners, progress and pretty JSON.
 * Boundary: an abstract class that is its own token. A driver is built per run around the decided mode and theme and
 *           writes only to that run's streams; it never tests a terminal or the environment itself. The text driver
 *           is the default; a command and the kernel are unchanged when a driver is swapped.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-001 to FR-003, FR-008 to FR-011.
 */
import { Port } from "@stackra/contracts";

import type { ChecklistSpec } from "#contracts/types/checklist-spec.type";
import type { ChecklistSummary } from "#contracts/types/checklist-summary.type";
import type { CommandStructure } from "#contracts/types/command-structure.type";
import type { MessageTone } from "#contracts/types/message-tone.type";
import type { NoteTone } from "#contracts/types/note-tone.type";
import type { Problem } from "#contracts/types/problem.type";
import type { Progress } from "#contracts/types/progress.type";
import type { Spinner } from "#contracts/types/spinner.type";
import type { TableSpec } from "#contracts/types/table-spec.type";
import type { TreeNode } from "#contracts/types/tree-node.type";

/**
 * Draws one run's output.
 *
 * @example
 * export class TextRendererDriver extends Driver(Renderer) {
 *   message(tone: MessageTone, text: string): void {
 *     this.write(tone, `  ${this.symbol(tone)} ${text}`);
 *   }
 * }
 */
export abstract class Renderer extends Port {
  /** A plain line (empty by default). */
  abstract line(text?: string): void;

  /** A one-line message; warn and error go to standard error. */
  abstract message(tone: MessageTone, text: string): void;

  /** A section title. */
  abstract title(text: string): void;

  /** `key ........ value` lines. */
  abstract keyValue(entries: Readonly<Record<string, unknown>>): void;

  /** A bulleted list. */
  abstract list(items: readonly string[]): void;

  /** A table fitted to the width, with status cells as symbol and word. */
  abstract table(table: TableSpec): void;

  /** Grouped status rows with their fixes, then the summary line; returns the counts. */
  abstract checklist(checklist: ChecklistSpec): ChecklistSummary;

  /** A tree, one level deep unless `expanded`. */
  abstract tree(nodes: readonly TreeNode[], expanded: boolean): void;

  /** A boxed note. */
  abstract box(text: string, tone: NoteTone, title?: string): void;

  /** The error screen; with `verbose`, the causes and raw detail under it. */
  abstract problem(problem: Problem, verbose: boolean): void;

  /** The theme's banner with the name and version (a terminal only). */
  abstract banner(): void;

  /** The name and version on one line. */
  abstract about(): void;

  /** A command's help, run as `binary`. */
  abstract help(structure: CommandStructure, binary: string): void;

  /** The visible commands under their headings, run as `binary`. */
  abstract commandList(structures: readonly CommandStructure[], binary: string): void;

  /** Runs `work` and writes its outcome line; rethrows its failure. */
  abstract task<T>(label: string, work: () => Promise<T> | T): Promise<T>;

  /** Starts a spinner. */
  abstract spinner(message: string): Spinner;

  /** Starts a progress bar of `total` steps. */
  abstract progress(total: number, label?: string): Progress;

  /** Data as pretty-printed JSON. */
  abstract json(data: unknown): void;
}
