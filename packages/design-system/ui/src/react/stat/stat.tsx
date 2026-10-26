/**
 * Stackra file contract:
 * Purpose: the web `Stat`: one headline figure with its label above and an optional badge beside it, for a dashboard
 *          tile or a widget (`<Stat label="Points" value={1200} badge="Gold" />`), drawn with the design system's
 *          `Text` and `Chip`.
 * Boundary: no HeroUI component of its own (HeroUI v3 has no stat); the label is read before the figure. A number is
 *           formatted in the `DesignSystemProvider`'s locale, or the browser's without one.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); owner decision 6 of STA-350 (thin wrappers).
 */
import { type ReactElement, use } from "react";

import { Chip } from "#react/chip/chip";
import { DesignSystemContext } from "#react/design-system-provider/design-system-context";
import { Text } from "#react/text/text";
import type { StatProps } from "#react/stat/stat.props";

/** A labelled headline figure. */
export function Stat({ label, value, badge }: StatProps): ReactElement {
  const locale = use(DesignSystemContext)?.locale;
  const figure = typeof value === "number" ? new Intl.NumberFormat(locale).format(value) : value;
  return (
    <div className="flex flex-col gap-1">
      <Text type="small" tone="muted">
        {label}
      </Text>
      <div className="flex items-center gap-2">
        <span className="text-3xl font-semibold tabular-nums">{figure}</span>
        {badge ? <Chip size="sm">{badge}</Chip> : null}
      </div>
    </div>
  );
}
