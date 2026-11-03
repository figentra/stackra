/**
 * Stackra file contract:
 * Purpose: `ChapterTitle`, a chapter's title on the landing: a large heading in the core tone (core only at
 *          a large size, per the tone rule) with a muted subtitle.
 * Boundary: composition of @stackra/ui only; every word comes in props. It draws no landmark of its own.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0165 (UI through @stackra/ui); STA-2041 (the landing).
 */
import { Heading, Text } from "@stackra/ui/react";
import type { ReactElement } from "react";

import type { ChapterTitleProps } from "#react/chapter-title/chapter-title.props";

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
    <div className={`flex max-w-2xl flex-col gap-3 ${className ?? ""}`}>
      <Heading level={level} type="h2" tone="core" className="text-balance">
        {title}
      </Heading>
      {subtitle ? <Text tone="muted">{subtitle}</Text> : null}
    </div>
  );
}
