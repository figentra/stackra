---
"@stackra/console": minor
---

Commands run child processes through `io.process.run(command, args, options)`, over a new `ProcessRunner` port
(STA-1966).

- **Output:** a child's output is captured and shown only under `--verbose`, with the command's secret values
  redacted.
- **Failure:** a non-zero exit throws a `CommandError` carrying the output. A failed `io.output.task` line shows the
  last 20 lines under it, and the whole output appears only under `--verbose`.
- **Interactive children:** `interactive: true` hands the terminal to the child, and is refused, naming the command,
  when the run is not interactive.
- **Working directory:** `io.cwd` is the run's working directory, from `ConsolePorts.cwd`, which is now required.
  `nodePorts()` sets it and binds `NodeProcessRunnerDriver`.
- **Testing:** `@stackra/console/testing` adds `MemoryProcessRunnerDriver`, and `runCommandForTest` takes `process` and
  `cwd`.
