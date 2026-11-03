/**
 * Stackra file contract:
 * Purpose: `TerminalDemoBlock`, the landing kit's try-it scene: the recorded `TerminalDemo` full width over a dithered
 *          horizon band, landing on the monitor drawing once the session has played.
 * Boundary: composition of @stackra/ui's `TerminalDemo` and `DitherArt`; the playing, the copy button and the motion
 *           level are the terminal's own. The monitor is an image whose URL comes in props, hidden from assistive
 *           tech and never mirrored; it waits on the terminal's `data-done` through a CSS `peer` rule, so the server
 *           and the edge, which draw the last frame, show it at once.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0165 (UI through @stackra/ui); ADR 0060 (light, dark, RTL);
 *          motion principles (one orchestrated moment); STA-2041.
 */
import { DitherArt, TerminalDemo } from "@stackra/ui/react";
import type { ReactElement } from "react";

import type { TerminalDemoBlockProps } from "#react/terminal-demo-block/terminal-demo-block.props";

/**
 * A recorded terminal session on a horizon, ending on a monitor.
 *
 * @example
 * <TerminalDemoBlock command="stackra create my-app" lines={recording} art={{ poster, sun: { x: 0.7, y: 0.9 } }} />
 */
export function TerminalDemoBlock({
  command,
  lines,
  art,
  label,
  result,
  monitorArt,
  className,
}: TerminalDemoBlockProps): ReactElement {
  return (
    <div
      data-slot="terminal-demo-block"
      className={`relative isolate flex flex-col items-center gap-8 overflow-hidden px-4 pt-12 ${className ?? ""}`}
    >
      {art ? (
        <DitherArt
          front="stk-tile-line"
          mask="top"
          {...art}
          className={`absolute inset-x-0 bottom-0 -z-10 h-2/3 ${art.className ?? ""}`}
        />
      ) : null}
      <TerminalDemo
        command={command}
        lines={lines}
        label={label}
        result={result}
        className="peer w-full max-w-3xl"
      />
      {monitorArt ? (
        <img
          src={monitorArt}
          alt=""
          data-slot="terminal-demo-block-monitor"
          className="invisible h-auto w-full max-w-sm min-w-41 peer-data-done:visible"
        />
      ) : null}
    </div>
  );
}
