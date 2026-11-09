/**
 * Stackra file contract:
 * Purpose: `StepRetryValues`, what a step's `retry.live` reads when the step fails: its attempts in all, its first wait
 *          and its backoff curve, each replacing the declared value when present (STA-2610).
 * Boundary: a type only; the values usually come from the workflow's settings, so an operator changes them without a
 *           deploy and the next retry uses them.
 * Runtime: isomorphic
 * Governing contract: ADR 0102 (decision 2: retries with backoff); STA-2610.
 */
import type { RetryPolicy } from "@stackra/contracts";

/** The live retry values of one step; an absent one keeps the declared value. */
export type StepRetryValues = Partial<Pick<RetryPolicy, "attempts" | "base" | "backoff">>;
