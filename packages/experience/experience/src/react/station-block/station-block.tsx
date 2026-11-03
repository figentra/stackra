/**
 * Stackra file contract:
 * Purpose: `StationBlock`, one station on the landing's pipe: a ruled blueprint band with the station rail (the pipe
 *          on the inline start, a junction square at the title), the title and its line, and the schematic window
 *          that shows what comes out here.
 * Boundary: composition of @stackra/ui only; every word comes in props. The rail and the junction are hidden
 *           decoration on blueprint token roles and sit on the inline start, so Arabic mirrors them. Nothing moves.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0165 (UI through @stackra/ui); ADR 0060 (RTL); STA-2041 (design
 *                     pass §2 and §4).
 */
import { BlueprintSection, Heading, Text } from "@stackra/ui/react";
import type { ReactElement } from "react";

import type { StationBlockProps } from "#react/station-block/station-block.props";

/**
 * A station: the rail, its words and its window.
 *
 * @example
 * <StationBlock id="call" title="Call" body="The client is typed." media={<Frame …/>} />
 */
export function StationBlock({
  id,
  title,
  body,
  media,
  status,
  className,
}: StationBlockProps): ReactElement {
  return (
    <BlueprintSection id={id} label={title} className={className ?? ""}>
      <div
        data-slot="station"
        {...(status ? { "data-status": status } : {})}
        className="relative grid gap-8 py-16 ps-10 pe-4 sm:pe-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:pe-12"
      >
        <span
          aria-hidden="true"
          data-slot="station-rail"
          className="absolute inset-y-0 start-4 w-[var(--blueprint-pipe-width)] bg-[var(--blueprint-pipe)]"
        />
        <div className="relative flex flex-col gap-3">
          <span
            aria-hidden="true"
            data-slot="station-junction"
            className="absolute top-3 -start-6 size-[var(--blueprint-junction-size)] -translate-x-1/2 bg-[var(--blueprint-pipe)] rtl:translate-x-1/2"
          />
          <Heading level={3} type="h3">
            {title}
          </Heading>
          <Text tone="muted">{body}</Text>
        </div>
        <div className="min-w-0">{media}</div>
      </div>
    </BlueprintSection>
  );
}
