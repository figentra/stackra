/**
 * Stackra file contract:
 * Purpose: `createOutput(setup)`, the `ConsoleOutput` of one run: the one layout every product shares (two-space
 *          gutter, a symbol column, dotted task lines, rounded notes), coloured by the theme at the decided depth,
 *          plain without colour or a terminal, silent but for errors under `--quiet`, and text-free under `--json`.
 * Boundary: writes only to the given streams; a spinner animates only when the mode allows it, with an unref'd timer.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-016, FR-018, FR-021, FR-022 and FR-026.
 */
import { SYMBOLS } from "#core/constants/symbols.constant";
import { createPainter } from "#core/functions/create-painter.function";
import { displayWidth } from "#core/functions/display-width.function";
import { isolateBidi } from "#core/functions/isolate-bidi.function";
import { renderBanner } from "#core/functions/render-banner.function";
import { renderBox } from "#core/functions/render-box.function";
import { renderTable } from "#core/functions/render-table.function";
import { stripEscapes } from "#core/functions/strip-escapes.function";
import type { ConsoleOutput } from "#core/types/console-output.type";
import type { NoteTone } from "#core/types/note-tone.type";
import type { OutputSetup } from "#core/types/output-setup.type";
import type { Progress } from "#core/types/progress.type";
import type { Spinner } from "#core/types/spinner.type";

/** Clears the current terminal line. */
const CLEAR_LINE = "\r\u001B[2K";

/** A line with a symbol in the gutter. */
const mark = (symbol: string, text: string) => `  ${symbol} ${isolateBidi(text)}`;

/** The output of one run. */
export function createOutput(setup: OutputSetup): ConsoleOutput {
  const { mode, theme } = setup;
  const painter = createPainter(mode.depth, theme.accent);
  const symbols = SYMBOLS[mode.unicode ? "unicode" : "ascii"];
  const silent = mode.json || mode.quiet;
  const out = (text: string) => {
    if (!silent) setup.stdout.write(`${text}\n`);
  };
  const err = (text: string) => {
    if (!mode.json) setup.stderr.write(`${text}\n`);
  };
  const dots = (left: string, right: string) =>
    painter.dim(
      symbols.dot.repeat(Math.max(3, mode.columns - displayWidth(left) - displayWidth(right) - 4)),
    );

  const toneOf: Record<
    NoteTone,
    { readonly paint: (text: string) => string; readonly title: string }
  > = {
    info: { paint: painter.accent, title: "Note" },
    warning: { paint: painter.warning, title: "Warning" },
    alert: { paint: painter.error, title: "Alert" },
  };

  return {
    line: (text = "") => out(text === "" ? "" : `  ${isolateBidi(text)}`),
    info: (text) => out(mark(painter.accent(symbols.info), text)),
    success: (text) => out(mark(painter.success(symbols.success), text)),
    warn: (text) => err(mark(painter.warning(symbols.warning), text)),
    error: (text) => err(mark(painter.error(symbols.error), text)),
    title: (text) => out(`\n  ${painter.bold(painter.accent(isolateBidi(text)))}\n`),
    keyValue: (entries) => {
      for (const [key, value] of Object.entries(entries)) {
        const right = isolateBidi(String(value));
        out(`  ${key} ${dots(key, right)} ${right}`);
      }
    },
    list: (items) => {
      for (const item of items) out(mark(painter.dim(symbols.bullet), item));
    },
    table: (headers, rows) => {
      for (const line of renderTable(headers, rows, { unicode: mode.unicode, painter })) out(line);
    },
    note: (text, tone = "info", title) => {
      const style = toneOf[tone];
      const lines = renderBox(isolateBidi(text), {
        title: title ?? style.title,
        unicode: mode.unicode,
        paint: style.paint,
        width: mode.columns,
      });
      const write = tone === "info" ? out : err;
      for (const line of lines) write(`  ${line}`);
    },
    task: async (label, work) => {
      const started = Date.now();
      const finish = (status: string) => {
        const timing = `${Date.now() - started}ms`;
        return `  ${isolateBidi(label)} ${dots(label, `${timing} ${stripEscapes(status)}`)} ${painter.dim(timing)} ${status}`;
      };
      try {
        const result = await work();
        out(finish(painter.bold(painter.success("DONE"))));
        return result;
      } catch (error) {
        err(finish(painter.bold(painter.error("FAIL"))));
        throw error;
      }
    },
    spinner: (message): Spinner => {
      let text = message;
      let frame = 0;
      const draw = () => {
        if (!silent)
          setup.stdout.write(
            `${CLEAR_LINE}  ${painter.accent(symbols.spinner[frame % symbols.spinner.length] ?? "")} ${text}`,
          );
        frame += 1;
      };
      const timer = mode.animate && !silent ? setInterval(draw, 80) : undefined;
      if (timer === undefined) out(mark(painter.dim(symbols.info), `${text}...`));
      else {
        (timer as { unref?: () => void }).unref?.();
        draw();
      }
      return {
        update: (next) => {
          text = next;
        },
        stop: (final = text, ok = true) => {
          if (timer !== undefined) {
            clearInterval(timer);
            if (!silent) setup.stdout.write(CLEAR_LINE);
          }
          if (ok) out(mark(painter.success(symbols.success), final));
          else err(mark(painter.error(symbols.error), final));
        },
      };
    },
    progress: (total, label = ""): Progress => {
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
          if (!silent)
            setup.stdout.write(`${CLEAR_LINE}  ${label} ${bar} ${String(percent).padStart(3)}%`);
        } else if (Math.floor(percent / 10) > reported) {
          reported = Math.floor(percent / 10);
          out(`  ${label} ${percent}%`.replace(/^ {3}/, "  "));
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
          if (mode.animate && !silent) setup.stdout.write("\n");
        },
      };
    },
    json: (data) => {
      if (mode.json) setup.onJson(data);
      else out(JSON.stringify(data, undefined, 2));
    },
    banner: () => {
      if (silent || !mode.tty) return;
      for (const line of renderBanner(theme, setup.version, mode)) setup.stdout.write(`${line}\n`);
    },
  };
}
