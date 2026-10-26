/**
 * Stackra file contract:
 * Purpose: `KpiTone`, the tones HeroUI Pro's KPI icon and progress bar are tinted with; `status` there, `tone` here.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-007.
 */
import type { Tone } from "@stackra/ui/contracts";

/** The tones HeroUI Pro's KPI icon and progress bar are tinted with; `status` there, `tone` here. */
export type KpiTone = Extract<Tone, "success" | "warning" | "danger">;
