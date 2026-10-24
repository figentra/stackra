/**
 * Stackra file contract:
 * Purpose: the one prop that says at which width a frame gives up its wide shape: `collapseBelow`. AppShell turns its
 *          sidebar into an off-canvas drawer below it, and TwoColumnLayout stacks its side column under the main one.
 * Boundary: types only. Native has no widths to switch on, so an adapted native form accepts the prop and ignores it,
 *           and its page says so (ADR 0313 decision 7).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0314.
 */
import type { LayoutBreakpoint } from "#contracts/enums/layout-breakpoint.enum";

/** Props shared by AppShell and TwoColumnLayout. */
export interface LayoutBreakpointContractProps {
  /** The breakpoint under which the frame collapses; AppShell defaults to `md` and TwoColumnLayout to `lg`. */
  readonly collapseBelow?: LayoutBreakpoint | undefined;
}
