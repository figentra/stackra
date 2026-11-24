# `baselines/`

One folder per framework, `baselines/<framework>/`, holding:

- `framework.json`: `name`, the pinned `version` (echoed into every run record as `frameworkVersion`), `create` (the
  command that builds the starting app in a directory it is given) and `start` (the command that runs the app on the
  port in `PORT`).
- `create.mjs` (or the script `create` names): creates the framework's official starter at the pinned version, plus the
  starting app of [`../tasks/starting-app.md`](../tasks/starting-app.md) on top of it.
- `solutions/<task>/`: for dry runs only, the files the scripted fake agent copies over the starting app, with an
  `agent-script.json` giving the counts it reports (`toolCalls`, `searchCalls`, `wrongEdits`, `filesOpened`).

`reference/` is not a framework result: it is Node's own `http` module with no dependency, and it proves the
acceptance tests and the runner.

Order: Stackra, NestJS and Express first (Node only). Frameworks that need JDK, .NET, Ruby, Python or PHP run only
inside containers, one at a time, and only when the box has room; until then they are listed as waiting in the
hand-over.

## Run one task (dry run, no model)

```sh
nice -n 19 node benchmarks/runner/run-task.mjs --task 01-add-a-field --framework reference --agent fake --run 1
```

The run makes a clean temporary directory, builds the starting app, applies the scripted agent, starts the app on a
free port, runs the task's acceptance tests, stops the app and writes one record to `benchmarks/results/` (or `--out`).
