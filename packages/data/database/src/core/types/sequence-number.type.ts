/**
 * Stackra file contract:
 * Purpose: `SequenceNumber`, a number `SequenceService` allocated or accepted: the integer, the period it counts in and
 *          the formatted value the document stores.
 * Boundary: a type only. The formatted value is immutable once written: a cancelled document keeps it.
 * Runtime: node
 * Governing contract: ADR 0342 (decisions 2 and 3).
 */

/** One number of a sequence. */
export interface SequenceNumber {
  /** The number, from 1. */
  readonly number: number;

  /** The year of a yearly sequence; 0 for one that never resets. */
  readonly period: number;

  /** The number in the sequence's format (`INV-2026-000042`). */
  readonly formatted: string;
}
