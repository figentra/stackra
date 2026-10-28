---
"@stackra/actions": minor
"@stackra/database": minor
"@stackra/model": minor
"@stackra/infra-gcp": minor
---

Query telemetry, the N+1 guard, batched link loading and a request memo (stackra-282). `@stackra/database` counts every
statement through one ORM logger (normalised shapes, no values), hands a `QuerySample` to the new `QueryObserver`
observers (`DatabaseOptions.observers`; `LoggerQueryObserverDriver` logs `database.slow_query`), ships
`DatabaseQueryBudgetDriver` for the new actions `QueryBudget` port, `DatabaseConfig.queries` (slow, repeats, strict),
`strictLoading` in `./testing`, `Extension.PgStatStatements` (ADR 0160 note) and batched `GraphQuery` relations.
`@stackra/actions` adds the `queryBudget` option and `ctx.memo`. `@stackra/model` adds `Link.loadMany` and
`Link.useBatchResolver`. `@stackra/infra-gcp` sets `log_min_duration_statement` and `auto_explain` from
`shared.database.slowQueryMs` (1000 ms by default, `false` turns it off).
