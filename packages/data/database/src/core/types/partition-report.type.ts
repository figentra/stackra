/**
 * Stackra file contract:
 * Purpose: `PartitionReport`, what one `maintainPartitions` run did to a model's table: the partitions it created, the
 *          expired ones it dropped, and the expired ones it kept because a legal hold covers a row in them.
 * Boundary: a type only; names are the partitions' table names.
 * Runtime: node
 * Governing contract: data-layer gaps db12, sc4; ADR 0134 (holds); ADR 0305 (rules 10 to 13).
 */

/** One table's maintenance. */
export interface PartitionReport {
  /** The table, `schema.table`. */
  readonly table: string;

  /** The partitions created ahead. */
  readonly created: readonly string[];

  /** The expired partitions detached and dropped. */
  readonly dropped: readonly string[];

  /** The expired partitions kept because a row in them is held. */
  readonly held: readonly string[];
}
