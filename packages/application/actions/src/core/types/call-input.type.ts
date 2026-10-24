/**
 * Stackra file contract:
 * Purpose: `CallInput<T>`, what a caller passes for an action or query instance type `T`: the data fields of its
 *          `handle` input, so a plain object literal (a test, a transport, a queued job) is accepted where the input is
 *          a shape class.
 * Boundary: a type only; `Fields` drops a shape's methods and its protected `~kind` brand, which would otherwise make
 *           a shape class nominal. The pipeline validates the value against the registered schema at run time.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 26); ADR 0095 as amended.
 */
import type { Fields } from "@stackra/validation";

import type { InputOf } from "#core/types/input-of.type";

/** The input data a caller passes to an action or query instance type `T`. */
export type CallInput<T> = Fields<InputOf<T>>;
