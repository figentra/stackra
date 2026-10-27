/**
 * Stackra file contract:
 * Purpose: `AppApprovalWaitPhase`, where the web's app approval wait stands: starting, pending, approved, ended or
 *          failed.
 * Boundary: a type only, `useAppApprovalWait`'s `phase`.
 * Runtime: isomorphic
 * Governing contract: STA-1304 (owner request 2026-10-27).
 */
import type { AppApprovalProgress } from "#core/index";

/** Where the wait stands. */
export type AppApprovalWaitPhase = "starting" | AppApprovalProgress | "failed";
