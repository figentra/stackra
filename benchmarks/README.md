# `benchmarks/`

The AI-era benchmark harness: how well an AI agent builds the same five tasks on Stackra and on other frameworks.
Like `tools/`, it is not a workspace member: no `package.json`, no tier, never published. Plain Node 24 `.mjs`, no
dependencies.

| Path                     | Holds                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| [`tasks/`](tasks)        | one folder per task: a plain prompt and acceptance tests that run over HTTP; all start from one app |
| [`baselines/`](baselines) | one script per framework that creates its official starter at a pinned version                |
| [`runner/`](runner)      | takes task × framework × model × run number and writes one JSON record per run                |
| [`results/`](results)    | the raw JSON records, named by harness version, framework versions, model id and date         |

## What one run records

Tokens in and out, wall time, tool calls, search calls, wrong edits, files opened and touched, and the acceptance
result, as one JSON file.
The shape lives in [`runner/validate-record.mjs`](runner/validate-record.mjs) and the file name in
[`runner/record-file-name.mjs`](runner/record-file-name.mjs).

## Method rules

From Linear STA-2709, the owner's direction of 23 Nov 2026, copied unchanged.

### Metrics

1. Tokens. AI tokens to understand a repository, and tokens to make a given change.
2. Time. Time to the first feature, to deliver a task, and to deploy.
3. Readability for an agent. How easily an agent finds the right file and follows the code: files opened, wrong
   edits, search calls.
4. First-try correctness. The share of tasks where the first answer passes the task's acceptance tests ("gives you
   exactly what you want").

### Method rules (owner)

- Reproducible and published: the same task set, the same models, the scripts in the repository, the raw results.
- Fair baselines: each framework's own idiomatic starter, set up by its own docs.
- No cherry-picked claims: every task and every run is published, failures included.
- Every number is versioned and dated (framework versions, model ids, harness version, run date).

### Also from the issue

- At least 3 runs per cell; report the median and the spread.
- The same models, prompt and limits for every framework.
- The deploy step goes to a local container target only, so nothing is spent on cloud.
- The first full run is internal, and the owner reviews it before anything is public. No number goes into copy until
  then.

## Status

Harness skeleton only. No model has been run and no key is used: the first runs are scripted fake-agent dry runs
(`dryRun: true`, zero tokens). Nothing here is published, and the owner reviews every number before it leaves the
repository.
