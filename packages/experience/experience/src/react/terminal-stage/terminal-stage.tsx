/**
 * Stackra file contract:
 * Purpose: `TerminalStage`, the landing kit's try-it scene: the recorded `TerminalDemo` full width over a dithered
 *          horizon band, landing on the monitor drawing once the session has played.
 * Boundary: composition of @stackra/ui's `TerminalDemo`, `DitherArt` and `Illustration`; the playing, the copy button
 *           and the motion level are the terminal's own. The monitor is `Illustration`'s four tone layers in the
 *           theme's roles, never fetched and never mirrored, decorative unless it has `alt`; it waits on the
 *           terminal's `data-done` through a CSS `peer` rule, so the server and the edge, which draw the last frame,
 *           show it at once.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0165 (UI through @stackra/ui); ADR 0060 (light, dark, RTL);
 *          motion principles (one orchestrated moment); STA-2041.
 */
import { DitherArt, Illustration, TerminalDemo } from "@stackra/ui/react";
import type { ReactElement } from "react";

import type { TerminalStageProps } from "#react/terminal-stage/terminal-stage.props";

/**
 * A recorded terminal session on a horizon, ending on a monitor.
 *
 * @example
 * <TerminalStage command="stackra create my-app" lines={recording} art={{ poster, sun: { x: 0.7, y: 0.9 } }} />
 */
export function TerminalStage({
  command,
  lines,
  art,
  label,
  result,
  monitor,
  className,
}: TerminalStageProps): ReactElement {
  return (
    <div
      data-slot="terminal-stage"
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
      {monitor ? (
        <div
          data-slot="terminal-stage-monitor"
          className="invisible w-full max-w-sm peer-data-done:visible"
        >
          <Illustration
            src={monitor.src}
            width={monitor.width}
            height={monitor.height}
            {...(monitor.alt === undefined ? {} : { alt: monitor.alt })}
            className="w-full"
          />
        </div>
      ) : null}
    </div>
  );
}
