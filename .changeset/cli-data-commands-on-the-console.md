---
"@stackra/cli": minor
---

`stackra db migrate`, `db rollback`, `settings:diff`, `settings:apply`, `search:reindex`, `search:status`,
`audit:verify` and `ops bootstrap-operator` are native console commands. Their flags, arguments, safety checks and exit
codes are unchanged (a usage error exits 2, a refused rollback, a broken audit chain or a failed bootstrap exits 1), and
each now takes `--json`: migrate and rollback return the environment and the migration names, the settings commands
the node, environment and rows or revisions, the search commands the job or the indexes, `audit:verify` its report and
`ops bootstrap-operator` the action's answer. The human output is the console's: success and info lines, lists, a
settings-diff and search-status table, an audit checklist that only warns when the bundle's own keys were used, and a
boxed problem for a refusal. `db seed` and `seed-pack` stay passthrough for now, so the seeders' output still streams
as it runs.
