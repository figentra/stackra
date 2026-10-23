/**
 * Stackra file contract:
 * Purpose: the props the web `Kpi` compound takes from the shared vocabulary: the card's children, the tone of its
 *          icon and progress bar, and the accessible name of its actions button.
 * Boundary: types only; web only. Every other prop is HeroUI Pro's own and passes through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-403 FR-007.
 */
import type { Tone } from "@stackra/ui/contracts";
import type { ReactNode } from "react";

/** The tones HeroUI Pro's KPI icon and progress bar are tinted with; `status` there, `tone` here. */
export type KpiTone = Extract<Tone, "success" | "warning" | "danger">;

/** Props of the `Kpi` root. */
export interface KpiContractProps {
  /** The card's parts, usually a header, content and footer. */
  readonly children: ReactNode;
}

/** Props of `Kpi.Icon` that the Stackra vocabulary names. */
export interface KpiIconContractProps {
  /** The colour role that tints the icon background; HeroUI Pro's `status`. Untinted when left out. */
  readonly tone?: KpiTone | undefined;
}

/** Props of `Kpi.Progress` that the Stackra vocabulary names. */
export interface KpiProgressContractProps {
  /** The colour role of the bar; HeroUI Pro's `status`. Untinted when left out. */
  readonly tone?: KpiTone | undefined;
}

/** Props of `Kpi.Actions` that the Stackra vocabulary names. */
export interface KpiActionsContractProps {
  /** The accessible name of the icon-only actions button; HeroUI Pro's `aria-label`, which it has no default for. */
  readonly label: string;
}
