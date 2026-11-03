/**
 * Stackra file contract:
 * Purpose: the web `TerminalDemo`: a framed terminal that plays a recorded CLI session a whole line at a time, on the
 *          motion kit's 80 ms floor step ("nothing is typed on"), under a top bar with a mono label, the command and a
 *          copy button; it ends on an optional result. It plays once it scrolls into view, at once, or never.
 * Boundary: a region named by `label`. The server and the edge render the last frame, so the whole session is in the
 *           HTML; a playing session hides the lines still to come (hidden from assistive tech too) without moving the
 *           layout. The log does not announce each line (`aria-live="off"`). Below the `full` motion level it never
 *           plays. Terminal text is code: left-to-right and never translated.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); motion principles (whole lines, 80 ms floor steps); WCAG 2.2 SC 2.2.2
 *          and 2.3.3; STA-2041.
 */
import { cn } from "@heroui/react";
import { type ReactElement, useEffect, useLayoutEffect, useRef, useState } from "react";

import type { TerminalLine } from "#contracts/types/terminal-line.type";
import { LONG_TAIL_KEYS } from "#core/constants/long-tail-keys.constant";
import { CopyButton } from "#react/copy-button/copy-button";
import { useMotion } from "#react/design-system-provider/use-motion";
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
  stepMs = 80,
  isCopyable = true,
  copyLabel,
  className,
}: TerminalDemoProps): ReactElement {
  const t = useUiText();
  const name = label ?? t(K.label);
  const motion = useMotion();
  const plays = autoplay !== "never" && motion === "full";
  const root = useRef<HTMLElement>(null);
  // The last frame first, as the server and the edge draw it.
  const [shown, setShown] = useState(lines.length);
  const [isStarted, setIsStarted] = useState(autoplay === "always");

  // Before paint, so a session about to play never flashes its last frame.
  useLayoutEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- reason: the server draws the last frame; only the browser rewinds it to play
    if (plays) setShown(0);
  }, [plays]);

  useEffect(() => {
    const element = root.current;
    if (!plays || isStarted || !element) return undefined;
    if (typeof IntersectionObserver !== "function") {
      // oxlint-disable-next-line react/set-state-in-effect -- reason: with no IntersectionObserver there is no view to wait for
      setIsStarted(true);
      return undefined;
    }
    const sight = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setIsStarted(true);
      },
      { threshold: 0.4 },
    );
    sight.observe(element);
    return () => sight.disconnect();
  }, [plays, isStarted]);

  useEffect(() => {
    if (!plays || !isStarted || shown >= lines.length) return undefined;
    const step = setTimeout(() => setShown((count) => count + 1), stepMs);
    return () => clearTimeout(step);
  }, [plays, isStarted, shown, lines.length, stepMs]);

  // Below the full motion level, or never playing, everything shows, whatever the timer reached.
  const visible = plays ? shown : lines.length;
  const isDone = visible >= lines.length;
  const repeats = new Map<string, number>();
  return (
    <section
      ref={root}
      aria-label={name}
      data-slot="terminal-demo"
      data-done={isDone ? "" : undefined}
      className={cn(
        "overflow-hidden rounded-[calc(var(--radius-lg)+4px)] border border-border bg-surface-secondary",
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
