/**
 * Stackra file contract:
 * Purpose: `InkRendererDriver`, the text driver with Ink for live parts only: while output animates, a live view, a
 *          spinner, a progress bar and a task's running line redraw in place through Ink, and each ends in the same
 *          static lines the text driver writes. Ink and React are imported the first time a live part animates, so a
 *          run that draws none never loads them; if they cannot load, the text driver's output stands.
 * Boundary: node only; draws on the run's stdout. Everything that is not live is the text driver's, unchanged.
 * Runtime: node
 * Governing contract: STA-1966 spec FR-004, EC-07 and SC-004; ADR 0506 (amendment of 2026-11-02, decision 1).
 */
// Type-only: erased at runtime, so neither loads until loadInk imports it.
import type * as Ink from "ink";
import type * as React from "react";

import type { LiveHandle } from "#contracts/types/live-handle.type";
import type { LiveRow } from "#contracts/types/live-row.type";
import type { LiveView } from "#contracts/types/live-view.type";
import type { Progress } from "#contracts/types/progress.type";
import type { Spinner } from "#contracts/types/spinner.type";
import { TextRendererDriver } from "#core/drivers/text-renderer.driver";
import { liveRows } from "#core/functions/live-rows.function";
import { statusCell } from "#core/functions/status-cell.function";

/** Ink and React, once loaded. */
interface InkModules {
  readonly ink: typeof Ink;
  readonly react: typeof React;
}

/** A screen Ink redraws: its lines are read on every frame. */
interface Screen {
  /** Redraws now. */
  readonly refresh: () => void;
  /** Clears the screen and stops redrawing. */
  readonly close: () => void;
}

/** The modules, imported once, on first use; undefined when they cannot load. */
let loading: Promise<InkModules | undefined> | undefined;

/** Imports Ink and React the first time a live part animates. */
const loadInk = () =>
  (loading ??= Promise.all([import("ink"), import("react")]).then(
    ([ink, react]) => ({ ink, react }),
    () => undefined,
  ));

/** How often a running screen redraws its spinner. */
const FRAME_MS = 80;

/** Draws live parts through Ink, everything else as text. */
export class InkRendererDriver extends TextRendererDriver {
  /** The spinner frame every screen shows. */
  private frame = 0;

  override live(view: LiveView): LiveHandle {
    if (!this.context.mode.animate) return super.live(view);
    const state = liveRows(view);
    const screen = this.screen(() => [
      ...(view.title === undefined
        ? []
        : [this.painter.bold(this.painter.accent(`  ${view.title}`))]),
      ...state.rows().map((row) => this.liveLine(row)),
    ]);
    return {
      update: (name, patch) => {
        state.update(name, patch);
        screen.refresh();
      },
      stop: () => {
        screen.close();
        return this.checklist({
          rows: state.settled(),
          ...(view.title === undefined ? {} : { title: view.title }),
        });
      },
    };
  }

  override spinner(message: string): Spinner {
    if (!this.context.mode.animate) return super.spinner(message);
    let text = this.bidi(message);
    const screen = this.screen(() => [`  ${this.spin()} ${text}`]);
    return {
      update: (next) => {
        text = this.bidi(next);
        screen.refresh();
      },
      stop: (final?: string, ok = true) => {
        screen.close();
        this.message(ok ? "success" : "error", final ?? text);
      },
    };
  }

  override progress(total: number, label = ""): Progress {
    if (!this.context.mode.animate) return super.progress(total, label);
    const { painter, symbols } = this;
    let done = 0;
    const bar = () => {
      const ratio = total <= 0 ? 1 : Math.min(1, done / total);
      const width = 30;
      const filled = Math.round(ratio * width);
      const percent = String(Math.floor(ratio * 100)).padStart(3);
      return `  ${this.bidi(label)} ${painter.accent(symbols.fill.repeat(filled))}${painter.dim(symbols.empty.repeat(width - filled))} ${percent}%`;
    };
    const screen = this.screen(() => [bar()]);
    return {
      advance: (steps = 1) => {
        done += steps;
        screen.refresh();
      },
      finish: () => {
        done = total;
        screen.close();
        this.line(bar().trimStart());
      },
    };
  }

  override task<T>(label: string, work: () => Promise<T> | T): Promise<T> {
    if (!this.context.mode.animate) return super.task(label, work);
    const text = this.bidi(label);
    return super.task(label, async () => {
      const screen = this.screen(() => [`  ${this.spin()} ${text}`]);
      try {
        return await work();
      } finally {
        screen.close();
      }
    });
  }

  /** The current spinner frame, in the accent colour. */
  private spin(): string {
    const frames = this.symbols.spinner;
    return this.painter.accent(frames[this.frame % frames.length] ?? "");
  }

  /** A live row: a spinner while it is pending or running, its status cell once it settles. */
  private liveLine(row: LiveRow): string {
    const busy = row.status === "pending" || row.status === "running";
    const cell = busy
      ? `${this.spin()} ${this.painter.dim(row.status)}`
      : statusCell(
          row.status as Exclude<LiveRow["status"], "pending" | "running">,
          this.painter,
          this.context.mode.unicode,
        );
    const detail = row.detail === undefined ? "" : `  ${this.painter.dim(this.bidi(row.detail))}`;
    return `  ${cell}  ${this.bidi(row.name)}${detail}`;
  }

  /** Starts redrawing `lines` through Ink once it loads; until then, and if it cannot load, nothing is redrawn. */
  private screen(lines: () => readonly string[]): Screen {
    let closed = false;
    let draw: (() => void) | undefined;
    let clear: (() => void) | undefined;
    void loadInk().then((modules) => {
      if (modules === undefined) {
        if (this.context.mode.verbose)
          this.message("warn", "Ink could not load; live output is drawn as text");
        return;
      }
      if (closed) return;
      const { ink, react } = modules;
      const tree = () =>
        react.createElement(
          ink.Box,
          { flexDirection: "column" },
          ...lines().map((line, index) => react.createElement(ink.Text, { key: index }, line)),
        );
      const instance = ink.render(tree(), {
        stdout: this.context.stdout as unknown as NodeJS.WriteStream,
        patchConsole: false,
        exitOnCtrlC: false,
      });
      draw = () => instance.rerender(tree());
      clear = () => {
        instance.clear();
        instance.unmount();
      };
    });
    const timer = setInterval(() => {
      this.frame += 1;
      draw?.();
    }, FRAME_MS);
    (timer as { unref?: () => void }).unref?.();
    return {
      refresh: () => draw?.(),
      close: () => {
        closed = true;
        clearInterval(timer);
        clear?.();
      },
    };
  }
}
