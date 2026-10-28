---
"@stackra/database": minor
---

`MetricsReader` widens (reporting gap 10): `value(aggregate, path?)` takes the new `Aggregate.Avg`, `Min`, `Max` and
`Distinct` beside `Count` and `Sum`; `series(aggregate, path?, grain)` buckets by the new `MetricGrain` (hour, day,
week, month, quarter) on the local calendar of `MetricsOptions.timeZone`, which `CrudService.metrics` defaults to the
running call's time zone (else UTC), so a day across a daylight-saving change is one local day; `breakdown(dimension,
aggregate, path?, limit)` groups a metric by a field, largest first. `MetricSeries` buckets are now keyed by the local
calendar, so a window that does not start on a bucket boundary may have one more bucket in its previous period.
