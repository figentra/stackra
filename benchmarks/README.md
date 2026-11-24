# `benchmarks/`

The AI-era benchmark harness: how well an AI agent builds the same five tasks on Stackra and on other frameworks.
Like `tools/`, it is not a workspace member: no `package.json`, no tier, never published. Plain Node 24 `.mjs`, no
dependencies.

| Path                     | Holds                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| [`tasks/`](tasks)        | one folder per task: a plain prompt, a starting state, and acceptance tests that run over HTTP |
| [`baselines/`](baselines) | one script per framework that creates its official starter at a pinned version                |
| [`runner/`](runner)      | takes task × framework × model × run number and writes one JSON record per run                |
| [`results/`](results)    | the raw JSON records, named by harness version, framework versions, model id and date         |

## What one run records

Tokens in and out, wall time, tool calls, files opened and touched, and the acceptance result, as one JSON file.
The shape lives in [`runner/validate-record.mjs`](runner/validate-record.mjs) and the file name in
[`runner/record-file-name.mjs`](runner/record-file-name.mjs).

## Method rules

> Pending. The owner's metrics and method rules are in Linear STA-2709 and are not yet copied here. This section
> is filled from that text, unchanged, before any task or run is marked ready.

## Status

Harness skeleton only. No model has been run and no key is used: the first runs are scripted fake-agent dry runs
(`dryRun: true`, zero tokens). Nothing here is published, and the owner reviews every number before it leaves the
repository.
