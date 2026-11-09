/**
 * Stackra file contract:
 * Purpose: the web `TerminalDemo`: a framed terminal that plays a recorded CLI session a whole line at a time, on the
 *          theme's `floor` motion step ("nothing is typed on"), under a top bar with a mono label, the command and a
 *          copy button; it ends on an optional result. It plays once it scrolls into view, at once, or never.
 * Boundary: a region named by `label`. The server and the edge render the last frame, so the whole session is in the
 *           HTML; a playing session hides the lines still to come (hidden from assistive tech too) without moving the
 *           layout. The log does not announce each line (`aria-live="off"`). Below the `full` motion level it never
 *           plays. Terminal text is code: left-to-right and never translated.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); motion principles (whole lines, the `floor` motion step); WCAG 2.2 SC 2.2.2
 *          and 2.3.3; STA-2041.
 */
import { cn } from "@heroui/react";
import { type ReactElement, useRef } from "react";

import type { TerminalLine } from "#contracts/types/terminal-line.type";
import { LONG_TAIL_KEYS } from "#core/constants/long-tail-keys.constant";
import { CopyButton } from "#react/copy-button/copy-button";
import { useFloorSteps } from "#react/hooks/use-floor-steps";
import { useUiText } from "#react/hooks/use-ui-text";
import type { TerminalDemoProps } from "#react/terminal-demo/terminal-demo.props";

/** The terminal's words. */
const K = LONG_TAIL_KEYS.ui.terminal_demo;

/** The sign before each kind of line, and its colour. */
const KIND: Readonly<Record<TerminalLine["kind"], readonly [string, string]>> = {
  command: ["$ ", "text-foreground"],
  output: ["", "text-muted"],
  prompt: ["? ", "text-foreground"],
  // Foreground, not steel: steel on surface-secondary is under 4.5:1 in light.
  choice: ["❯ ", "text-foreground"],
  success: ["✓ ", "text-success"],
};

/** A terminal that plays a recorded session line by line. */
export function TerminalDemo({
  command,
  label,
  lines,
  result,
  autoplay = "in-view",
  stepMs,
  isCopyable = true,
  copyLabel,
  className,
}: TerminalDemoProps): ReactElement {
  const t = useUiText();
  const name = label ?? t(K.label);
  const root = useRef<HTMLElement>(null);
  // One whole line a step; below the full motion level, or never playing, every line shows.
  const visible = useFloorSteps(root, {
    total: lines.length,
    isEnabled: autoplay !== "never",
    startsAtOnce: autoplay === "always",
    threshold: 0.4,
    stepMs,
  });
  const isDone = visible >= lines.length;
  const repeats = new Map<string, number>();
  return (
    <section
      ref={root}
      aria-label={name}
      data-slot="terminal-demo"
      data-done={isDone ? "" : undefined}
      className={cn(
        "overflow-hidden rounded-[calc(var(--radius-lg)+var(--spacing))] border border-border bg-surface-secondary",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-border px-3 py-2 text-sm">
        {/* A section label in the body face, sentence case and never tracked (Arabic joins); steel only as its border. */}
        <span className="shrink-0 rounded-[var(--radius-sm)] border border-accent px-2 py-0.5 text-xs text-foreground">
          {name}
        </span>
        <code dir="ltr" className="min-w-0 flex-1 truncate font-mono text-foreground">
          <span aria-hidden="true" className="text-muted">
            {"$ "}
          </span>
          {command}
        </code>
        {isCopyable ? (
          <CopyButton value={command} label={copyLabel ?? t(K.copy)} variant="ghost" size="sm" />
        ) : null}
      </div>
      <div
        role="log"
        aria-live="off"
        dir="ltr"
        className="flex flex-col gap-0.5 p-4 font-mono text-sm leading-relaxed"
      >
        {lines.map((line, index) => {
          const [sign, tone] = KIND[line.kind];
          const isHidden = index >= visible;
          // The text and how often it was printed before: a stable key for a recorded session.
          const seen = (repeats.get(line.text) ?? 0) + 1;
          repeats.set(line.text, seen);
          return (
            <div
              key={`${line.text}#${seen}`}
              data-kind={line.kind}
              {...(isHidden ? { "aria-hidden": true } : {})}
              className={cn("whitespace-pre-wrap", tone, isHidden && "invisible")}
            >
              {sign ? <span aria-hidden="true">{sign}</span> : null}
              {line.text}
            </div>
          );
        })}
      </div>
      {result != null && isDone ? (
        <div data-slot="terminal-demo-result" className="px-4 pb-4">
          {result}
        </div>
      ) : null}
    </section>
  );
}
