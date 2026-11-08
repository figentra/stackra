/**
 * Stackra file contract:
 * Purpose: `TextRendererDriver`, the default `Renderer`: plain lines in the shared layout (the gutter, the symbol
 *          column, dotted task lines, rounded boxes, the problem screen, status tables, checklists and trees),
 *          coloured to the decided depth; a spinner animates and a bar redraws only while the mode animates.
 * Boundary: writes only to the context's streams; warnings, errors and the problem screen go to standard error.
 *           Under `--json` it writes nothing; under `--quiet` only standard error. With colour off it writes no
 *           escape byte and no cursor movement.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-016 to FR-021 and FR-026; STA-1966 spec FR-002, FR-003, FR-007 and FR-008 to
 *                     FR-011.
 */
import { Driver } from "@stackra/container";

import { Renderer } from "#contracts/ports/renderer.port";
import type { ChecklistSpec } from "#contracts/types/checklist-spec.type";
import type { ChecklistSummary } from "#contracts/types/checklist-summary.type";
import type { CommandStructure } from "#contracts/types/command-structure.type";
import type { LiveHandle } from "#contracts/types/live-handle.type";
import type { LiveView } from "#contracts/types/live-view.type";
import type { MessageTone } from "#contracts/types/message-tone.type";
import type { NoteTone } from "#contracts/types/note-tone.type";
import type { Problem } from "#contracts/types/problem.type";
import type { Progress } from "#contracts/types/progress.type";
import type { Spinner } from "#contracts/types/spinner.type";
import type { TableSpec } from "#contracts/types/table-spec.type";
import type { TreeNode } from "#contracts/types/tree-node.type";
import { SYMBOLS } from "#core/constants/symbols.constant";
import { createPainter } from "#core/functions/create-painter.function";
import { displayWidth } from "#core/functions/display-width.function";
import { liveRows } from "#core/functions/live-rows.function";
import { renderBanner } from "#core/functions/render-banner.function";
import { renderBox } from "#core/functions/render-box.function";
import { renderChecklist } from "#core/functions/render-checklist.function";
import { renderHelp } from "#core/functions/render-help.function";
import { renderList } from "#core/functions/render-list.function";
import { renderProblem } from "#core/functions/render-problem.function";
import { renderTable } from "#core/functions/render-table.function";
import { renderTree } from "#core/functions/render-tree.function";
import { stripEscapes } from "#core/functions/strip-escapes.function";
import { visualBidi } from "#core/functions/visual-bidi.function";
import type { Painter } from "#core/types/painter.type";
import type { RenderContext } from "#core/types/render-context.type";

/** Clears the current terminal line. */
const CLEAR_LINE = "\r\u001B[2K";

/** How many lines of a failed step's output its task line shows. */
const TAIL_LINES = 20;

/** A line with a symbol in the gutter. */
const mark = (symbol: string, text: string) => `  ${symbol} ${text}`;

/** Draws a run's output as text. */
export class TextRendererDriver extends Driver(Renderer) {
  /** The colours of the run. */
  protected readonly painter: Painter;

  /** The symbol set of the run. */
  protected readonly symbols: (typeof SYMBOLS)["unicode"];

  /** Right-to-left text, reordered once here before anything measures it. */
  protected readonly bidi: (text: string) => string;

  constructor(protected readonly context: RenderContext) {
    super();
    this.painter = createPainter(context.mode.depth, context.theme.accent);
    this.symbols = SYMBOLS[context.mode.unicode ? "unicode" : "ascii"];
    this.bidi = context.mode.bidi === "visual" ? visualBidi : (text: string) => text;
  }

  /** Nothing goes to standard output under `--json` or `--quiet`. */
  private get silent(): boolean {
    return this.context.mode.json || this.context.mode.quiet;
  }

  /** Writes one plain line, empty by default. */
  line(text = ""): void {
    this.out(text === "" ? "" : `  ${this.bidi(text)}`);
  }

  /** Writes a one-line message; warn and error go to standard error. */
  message(tone: MessageTone, text: string): void {
    const { painter, symbols } = this;
    const body = this.bidi(text);
    if (tone === "info") this.out(mark(painter.accent(symbols.info), body));
    else if (tone === "success") this.out(mark(painter.success(symbols.success), body));
    else if (tone === "warn") this.err(mark(painter.warning(symbols.warning), body));
    else this.err(mark(painter.error(symbols.error), body));
  }

  /** Writes a bold section title. */
  title(text: string): void {
    this.out(`\n  ${this.painter.bold(this.painter.accent(this.bidi(text)))}\n`);
  }

  /** Writes one `key ........ value` line per entry. */
  keyValue(entries: Readonly<Record<string, unknown>>): void {
    for (const [name, value] of Object.entries(entries)) {
      const key = this.bidi(name);
      const right = this.bidi(String(value));
      this.out(`  ${key} ${this.dots(key, right)} ${right}`);
    }
  }

  /** Writes a bulleted list. */
  list(items: readonly string[]): void {
    for (const item of items)
      this.out(mark(this.painter.dim(this.symbols.bullet), this.bidi(item)));
  }

  /** Writes a table fitted to the width. */
  table(table: TableSpec): void {
    const { mode } = this.context;
    const options = {
      unicode: mode.unicode,
      painter: this.painter,
      columns: mode.columns,
      bidi: this.bidi,
    };
    for (const line of renderTable(table, options)) this.out(line);
  }

  /** Writes the grouped status rows and the summary line; returns the counts. */
  checklist(checklist: ChecklistSpec): ChecklistSummary {
    const options = { unicode: this.context.mode.unicode, painter: this.painter, bidi: this.bidi };
    const { lines, summary } = renderChecklist(checklist, options);
    for (const line of lines) this.out(line);
    return summary;
  }

  /** Writes a tree, one level deep unless `expanded`. */
  tree(nodes: readonly TreeNode[], expanded: boolean): void {
    const options = {
      unicode: this.context.mode.unicode,
      painter: this.painter,
      expanded,
      bidi: this.bidi,
    };
    for (const line of renderTree(nodes, options)) this.out(line);
  }

  /** Writes a rounded box; a warning or alert goes to standard error. */
  box(text: string, tone: NoteTone, title?: string): void {
    const { painter } = this;
    const style = {
      info: { paint: painter.accent, title: "Note" },
      warning: { paint: painter.warning, title: "Warning" },
      alert: { paint: painter.error, title: "Alert" },
    }[tone];
    const lines = renderBox(this.bidi(text), {
      title: title ?? style.title,
      unicode: this.context.mode.unicode,
      paint: style.paint,
      width: this.context.mode.columns,
    });
    for (const line of lines)
      if (tone === "info") this.out(`  ${line}`);
      else this.err(`  ${line}`);
  }

  /** Writes the problem screen to standard error. */
  problem(problem: Problem, verbose: boolean): void {
    const { mode } = this.context;
    const options = { unicode: mode.unicode, painter: this.painter, width: mode.columns, verbose };
    for (const line of renderProblem(problem, options)) this.err(line);
  }

  /** Writes the theme's banner, on a terminal only. */
  banner(): void {
    if (this.silent || !this.context.mode.tty) return;
    for (const line of renderBanner(this.context.theme, this.context.version, this.context.mode))
      this.context.stdout.write(`${line}\n`);
  }

  /** Writes the name and version on one line. */
  about(): void {
    this.out(
      `${this.painter.bold(this.context.theme.name)} ${this.painter.success(this.context.version)}`,
    );
  }

  /** Writes a command's help, run as `binary`. */
  help(structure: CommandStructure, binary: string): void {
    for (const line of renderHelp(structure, binary, this.painter)) this.out(line);
  }

  /** Writes the visible commands under their headings. */
  commandList(structures: readonly CommandStructure[], binary: string): void {
    for (const line of renderList(structures, binary, this.painter)) this.out(line);
  }

  /** Runs `work` and writes a dotted DONE or FAIL line with its timing; rethrows a failure. */
  async task<T>(name: string, work: () => Promise<T> | T): Promise<T> {
    const { painter } = this;
    const label = this.bidi(name);
    const started = Date.now();
    const finish = (status: string) => {
      const timing = `${Date.now() - started}ms`;
      return `  ${label} ${this.dots(label, `${timing} ${stripEscapes(status)}`)} ${painter.dim(timing)} ${status}`;
    };
    try {
      const result = await work();
      this.out(finish(painter.bold(painter.success("DONE"))));
      return result;
    } catch (error) {
      this.err(finish(painter.bold(painter.error("FAIL"))));
      // The tail of a failed step's output (a CommandError's detail) sits under its line; all of it under --verbose.
      const detail = (error as { readonly detail?: unknown } | null)?.detail;
      if (typeof detail === "string" && detail.trim() !== "")
        for (const line of detail.trimEnd().split("\n").slice(-TAIL_LINES))
          this.err(painter.dim(`    │ ${line}`));
      throw error;
    }
  }

  /** Starts a spinner that animates only while the mode animates. */
  spinner(message: string): Spinner {
    const { painter, symbols, context } = this;
    const silent = this.silent;
    let text = this.bidi(message);
    let frame = 0;
    const draw = () => {
      if (!silent)
        context.stdout.write(
          `${CLEAR_LINE}  ${painter.accent(symbols.spinner[frame % symbols.spinner.length] ?? "")} ${text}`,
        );
      frame += 1;
    };
    const timer = context.mode.animate && !silent ? setInterval(draw, 80) : undefined;
    if (timer === undefined) this.out(mark(painter.dim(symbols.info), `${text}...`));
    else {
      (timer as { unref?: () => void }).unref?.();
      draw();
    }
    return {
      update: (next) => {
        text = this.bidi(next);
      },
      stop: (final?: string, ok = true) => {
        if (timer !== undefined) {
          clearInterval(timer);
          if (!silent) context.stdout.write(CLEAR_LINE);
        }
        const shown = final === undefined ? text : this.bidi(final);
        if (ok) this.out(mark(painter.success(symbols.success), shown));
        else this.err(mark(painter.error(symbols.error), shown));
      },
    };
  }

  /** Starts a progress bar of `total` steps; without animation, a line per ten percent. */
  progress(total: number, name = ""): Progress {
    const { painter, symbols, context } = this;
    const { mode } = context;
    const label = this.bidi(name);
    let done = 0;
    let reported = -1;
    const width = Math.max(10, Math.min(40, mode.columns - displayWidth(label) - 16));
    const draw = () => {
      const ratio = total <= 0 ? 1 : Math.min(1, done / total);
      const percent = Math.floor(ratio * 100);
      if (mode.animate) {
        const filled = Math.round(ratio * width);
        const bar =
          painter.accent(symbols.fill.repeat(filled)) +
          painter.dim(symbols.empty.repeat(width - filled));
        if (!this.silent)
          context.stdout.write(`${CLEAR_LINE}  ${label} ${bar} ${String(percent).padStart(3)}%`);
      } else if (Math.floor(percent / 10) > reported) {
        reported = Math.floor(percent / 10);
        this.out(`  ${label} ${percent}%`.replace(/^ {3}/, "  "));
      }
    };
    draw();
    return {
      advance: (steps = 1) => {
        done += steps;
        draw();
      },
      finish: () => {
        done = total;
        draw();
        if (mode.animate && !this.silent) context.stdout.write("\n");
      },
    };
  }

  /** Tracks a live view and writes its final checklist when it stops. */
  live(view: LiveView): LiveHandle {
    // Text never redraws: the view's final checklist is written when it stops.
    const state = liveRows(view);
    return {
      update: state.update,
      stop: () =>
        this.checklist({
          rows: state.settled(),
          ...(view.title === undefined ? {} : { title: view.title }),
        }),
    };
  }

  /** Writes data as pretty-printed JSON. */
  json(data: unknown): void {
    this.out(JSON.stringify(data, undefined, 2));
  }

  /** A line on standard output. */
  private out(text: string): void {
    if (!this.silent) this.context.stdout.write(`${text}\n`);
  }

  /** A line on standard error. */
  private err(text: string): void {
    if (!this.context.mode.json) this.context.stderr.write(`${text}\n`);
  }

  /** Dim dots from `left` to `right` across the width. */
  private dots(left: string, right: string): string {
    const room = this.context.mode.columns - displayWidth(left) - displayWidth(right) - 4;
    return this.painter.dim(this.symbols.dot.repeat(Math.max(3, room)));
  }
}
