/**
 * Stackra file contract:
 * Purpose: `TimelineProps`, props of the web Timeline: HeroUI Pro's own root props, passed through unchanged.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import type { TimelineRootProps as HeroTimelineRootProps } from "@heroui-pro/react/timeline";

/** Props of the web Timeline: HeroUI Pro's own root props, passed through unchanged. */
export type TimelineProps = HeroTimelineRootProps;
