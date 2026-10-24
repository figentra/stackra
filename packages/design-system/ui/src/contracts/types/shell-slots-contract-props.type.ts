/**
 * Stackra file contract:
 * Purpose: the two slots every bar of the shell offers, at the logical start and the logical end of the bar: AppHeader
 *          (a sidebar trigger and the palette, notification and user controls), PageHeader and Section (a status and
 *          the actions). In right-to-left the slots swap sides, so neither is ever "left" or "right".
 * Boundary: types only. A slot is a node the app fills, so no shell component imports another: the pieces meet in the
 *           app's code, as the wave 5 `emptyState` slot does (ADR 0313 decision 5).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0313 (the `endContent` row); ADR 0314.
 */
import type { ReactNode } from "react";

/** Slots shared by AppHeader, PageHeader and Section. */
export interface ShellSlotsContractProps {
  /** A node at the logical start of the bar, before its main content. */
  readonly startContent?: ReactNode | undefined;
  /** A node at the logical end of the bar, after its main content. */
  readonly endContent?: ReactNode | undefined;
}
