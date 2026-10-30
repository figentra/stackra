---
"@stackra/reports": minor
---

Add the `Forecaster` port (`./contracts`, key `reports.Forecaster`) with its query and row types
(`ForecastQuery`, `ForecastSeries`, `ForecastRow`, `ForecastFrequency`, `ForecastModel`), the `http` driver
(`HttpForecasterDriver`, over the `tools-forecast` image; an optional bearer token is read at call time from
`SecretStore` by name and never logged) and the `memory` driver (`MemoryForecasterDriver`), with `ForecastQueryInvalidError`
and `ForecastUnavailableError` (STA-1637, ADR 0492 decision 8). `ReportsConfig` gains `forecaster` (`http`, `memory`) and
`forecast` (`baseUrl`, `tokenSecret`).
