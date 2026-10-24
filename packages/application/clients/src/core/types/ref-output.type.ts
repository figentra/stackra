/**
 * Stackra file contract:
 * Purpose: `RefOutput<R>`, what an action or query ref answers: its output schema's output side, decoded (dates as
 *          `Date`, public ids branded).
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 3).
 */
import type { output } from "zod";

import type { CallRef } from "#core/types/call-ref.type";

/** The answer of `R`, decoded. */
export type RefOutput<R extends CallRef> = output<R["output"]>;
