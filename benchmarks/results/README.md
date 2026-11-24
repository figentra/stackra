# `results/`

Raw run records, one JSON file per run, named by `recordFileName` in
[`../runner/record-file-name.mjs`](../runner/record-file-name.mjs): harness version, framework and version, model id, date, task and run
number. Records are never edited by hand. Dry-run records carry `"dryRun": true` and `"model": "fake-agent"`.
