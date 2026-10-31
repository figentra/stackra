/**
 * Stackra file contract:
 * Purpose: `ConsoleOutput`, everything a command writes: messages, a title, key-value lines, lists, tables, boxed
 *          notes, task lines, spinners, progress bars, JSON data and the banner, in one layout for every product.
 * Boundary: a type only; `createOutput` implements it for a decided `ConsoleMode`. Warnings and errors go to standard
 *           error; under `--json` the text components write nothing.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-016, FR-018, FR-021 and FR-022.
 */
import type { NoteTone } from "#core/types/note-tone.type";
import type { Progress } from "#core/types/progress.type";
import type { Spinner } from "#core/types/spinner.type";

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

  /** A table. */
  readonly table: (headers: readonly string[], rows: readonly (readonly unknown[])[]) => void;

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
