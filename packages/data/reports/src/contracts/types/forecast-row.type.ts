/**
 * Stackra file contract:
 * Purpose: `ForecastRow`, one model's forecast of one series: the future timestamps, the mean and the 80% band.
 * Boundary: a type only; numbers and ids. A model that cannot fit a series leaves no row for it. For a model with no
 *           interval (`CrostonOptimized`) `lo80` and `hi80` equal `mean`.
 * Runtime: isomorphic
 * Governing contract: ADR 0492 (decision 8); ADR 0294 (decision 15: the leaf entry).
 */
import type { ForecastModel } from "#contracts/types/forecast-model.type";

/** One model's forecast of one series: the future timestamps, the expected value and the 80% band per step. */
export interface ForecastRow {
  /** The series' id. */
  readonly id: string;

  /** The model that produced it. */
  readonly model: ForecastModel;

  /** The forecast steps as ISO 8601 timestamps, one per step ahead. */
  readonly timestamps: readonly string[];

  /** The expected value per step. */
  readonly mean: readonly number[];

  /** The lower bound of the 80% interval per step. */
  readonly lo80: readonly number[];

  /** The upper bound of the 80% interval per step. */
  readonly hi80: readonly number[];
}
