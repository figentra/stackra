/**
 * Stackra file contract:
 * Purpose: the web `StatusBadge`: a record's state as a neutral `Chip` with a 6 px dot in the state's tone before the
 *          text, the adapted form HeroUI documents (it ships no status component).
 * Boundary: builds on `#react/chip/chip`; the text carries the meaning, the dot repeats it; never a live region. The
 *          dot is an inline style, so it needs no `@source` line and a test can read it.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0304 (decisions 3 and 4); WCAG 2.2 SC 1.4.1.
 */
import type { CSSProperties } from "react";

import type { StatusBadgeContractProps } from "#contracts/types/status-badge-contract-props.type";
import { STATUS_DOT_ROLE } from "#core/constants/status-dot-role.constant";
import { Chip, type ChipProps } from "#react/chip/chip";
import type { ChipContractProps } from "#contracts/types/chip-contract-props.type";

/** Props of the web StatusBadge: the shared contract plus the Chip's pass-through props. */
export type StatusBadgeProps = StatusBadgeContractProps & Omit<ChipProps, keyof ChipContractProps>;

/** The dot's shape: a 6 px circle HeroUI's own status sample uses, which never shrinks in a tight row. */
const DOT_STYLE: CSSProperties = { width: 6, height: 6, borderRadius: 9999, flexShrink: 0 };

/**
 * A record's state: its name as text, with a dot in the state's tone before it. The chip stays neutral so the text
 * keeps its contrast; the dot only repeats the meaning in colour.
 */
export function StatusBadge({ tone = "default", children, ...rest }: StatusBadgeProps) {
  return (
    <Chip
      {...rest}
      startIcon={
        <span
          data-slot="status-badge-dot"
          style={{ ...DOT_STYLE, backgroundColor: `var(--${STATUS_DOT_ROLE[tone]})` }}
        />
      }
    >
      {children}
    </Chip>
  );
}
