/**
 * Stackra file contract:
 * Purpose: `DeskUnavailableError`, the refusal the guide's in-memory on-call tool answers while it is down:
 *          `unavailable`, which the queue retries.
 * Boundary: test support only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0148 (a retryable refusal is retried); STA-2852.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The tool is down: retry later. */
export class DeskUnavailableError extends Refusal({ kind: ErrorKind.Unavailable }) {}
