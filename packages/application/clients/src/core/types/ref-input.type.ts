/**
 * Stackra file contract:
 * Purpose: `RefInput<R>`, what a caller passes to an action or query ref: its input schema's input side, so a field with
 *          a default may be left out and a date may be a `Date` or its ISO text.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 3).
 */
import type { input } from "zod";

import type { CallRef } from "#core/types/call-ref.type";

/** The input of `R`, as a caller writes it. */
export type RefInput<R extends CallRef> = input<R["input"]>;
