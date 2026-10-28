---
"@stackra/database": minor
---

Add the `TimeSeries<S>({ key, time, dimensions, measures, rollups, lateness, retain })` kind (data-layer gap cdc7):
scheduler-kept rollup tables `ts_<key>_<grain>` over a big append-only source. `registerTimeSeries` pairs a series with
its source model, `rollUpTimeSeries(series, now)` recomputes the recent UTC buckets and prunes expired ones,
`rollupTable(key, grain)` names a rollup table, and `rollUpAllTimeSeries(now)` runs it for every registered series; the
`RollUpTimeSeriesAction` job of `@stackra/data-maintenance` (`data_maintenance.timeseries.rollup@1`) calls it every 15
minutes per scope.
