/**
 * Stackra file contract:
 * Purpose: `ChapterTitle`, a chapter's title on the landing: a large heading in the default (paper) tone with a
 *          muted subtitle, in its ruled band. Champagne stays with the engine, the one primary action and the closing
 *          wordmark (design pass §3).
 * Boundary: composition of @stackra/ui only; every word comes in props. Its band is not a landmark (it has no name),
 *           and nothing in it takes focus.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0165 (UI through @stackra/ui); ADR 0520 (the core); STA-2041
 *                     (design pass §3).
 */
import { Heading, Text } from "@stackra/ui/react";
import type { ReactElement } from "react";

import type { ChapterTitleProps } from "#react/chapter-title/chapter-title.props";
import { RuledBand } from "#react/ruled-band/ruled-band";

/**
 * A chapter's heading and subtitle.
 *
 * @example
 * <ChapterTitle title="Write it once" subtitle="One action becomes every surface." />
 */
export function ChapterTitle({
  title,
  subtitle,
  level = 2,
  className,
}: ChapterTitleProps): ReactElement {
  return (
    <RuledBand>
      <div className={`flex max-w-2xl flex-col gap-3 ${className ?? ""}`}>
        <Heading level={level} type="h2" className="text-balance">
          {title}
        </Heading>
        {subtitle ? <Text tone="muted">{subtitle}</Text> : null}
      </div>
    </RuledBand>
  );
}
