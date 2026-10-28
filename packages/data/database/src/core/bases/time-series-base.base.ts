/**
 * Stackra file contract:
 * Purpose: `TimeSeriesBase<S>`, the instance side every `TimeSeries` declaration shares: its checked options.
 * Boundary: internal; reached through `TimeSeries`. Reads the kind registry, which holds the frozen options.
 * Runtime: isomorphic
 * Governing contract: data-layer gap cdc7 (stackra-321); ADR 0294 (decision 16: kinds by base class).
 */
import { kindOf } from "@stackra/container";

import type { TimeSeriesOptions } from "#core/types/time-series-options.type";

/** The instance side of a time series. */
export abstract class TimeSeriesBase<S extends object = object> {
  /** Type-only kind brand, so a class of another kind cannot stand in for a time series. */
  declare readonly "~kind": "time_series";

  /** Type-only source, so `TimeSeriesBase<MeterReading>` and `TimeSeriesBase<Order>` differ. */
  declare readonly "~source": S;

  /**
   * The checked options.
   *
   * @throws TypeError for a class that was not declared with `TimeSeries<S>({...})`.
   */
  get declaration(): TimeSeriesOptions {
    const record = kindOf(this.constructor);
    if (record?.kind !== "time_series" || typeof record.options["key"] !== "string")
      throw new TypeError(`${this.constructor.name} extends no TimeSeries<S>({ key, ... })`);
    return record.options as unknown as TimeSeriesOptions;
  }
}
