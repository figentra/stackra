/**
 * Stackra file contract:
 * Purpose: `AutomationStep`, one step of an `AutomationDocument`: its name, the action block it calls with its input,
 *          the trigger block it may first wait for, its condition, retries and timeout.
 * Boundary: a type only, an element of `AutomationDocument["steps"]`.
 * Runtime: isomorphic
 * Governing contract: ADR 0122 (decision 3).
 */
import type { AutomationDocument } from "#core/types/automation-document.type";

/** One step. */
export type AutomationStep = AutomationDocument["steps"][number];
