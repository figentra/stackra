/**
 * Stackra file contract:
 * Purpose: `SequenceBlock`, a block of numbers `SequenceService.reserve` hands a device at sync, which it issues
 *          offline in order.
 * Boundary: a type only. The block carries the format and the period, so the device formats a number exactly as the
 *           server does; `claim` accepts the numbers in order, and `release` or `void` closes the block.
 * Runtime: node
 * Governing contract: ADR 0342 (decision 4); ADR 0338.
 */
import type { PublicId } from "@stackra/contracts";

/** A reserved block. */
export interface SequenceBlock {
  /** The block's public id. */
  readonly id: PublicId<"sqb">;

  /** The device that holds it. */
  readonly holder: string;

  /** The year of a yearly sequence; 0 for one that never resets. */
  readonly period: number;

  /** The first number of the block. */
  readonly first: number;

  /** The last number of the block. */
  readonly last: number;

  /** The sequence's format pattern. */
  readonly format: string;
}
