/**
 * Stackra file contract:
 * Purpose: `RunOrigin`, the call that started a run as the journal keeps it: the call's id and key, the caller, and the
 *          locale, time zone, currency and market its steps run in.
 * Boundary: a type only: the data fields of @stackra/actions' `ExtensionContext`, stored as JSON so a step resumed in
 *           another process gets the same context. It carries no input and no record.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 1: the handler context); ADR 0102 (decision 1: the journal).
 */
import type { ExtensionContext } from "@stackra/actions";

/** The starting call of a run. */
export type RunOrigin = Omit<ExtensionContext, "abortSignal" | "now">;
