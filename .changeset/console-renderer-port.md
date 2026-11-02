---
"@stackra/console": minor
---

Output goes through a `Renderer` port, and the new `TextRendererDriver` is the default (STA-1966). A command and the
kernel are unchanged when a driver is swapped (`ConsolePorts.renderer`, and `runCommandForTest`'s `renderer` option).

New components:

- **Status tables:** `io.output.table({ columns, rows, groupBy })`. Status cells read `✓ ok`, `⚠ warn` and `✗ fail`,
  and the widest text column is cut to fit the width.
- **Checklists:** `io.output.checklist({ rows })`, grouped, with fix lines and a summary. A failed row exits 1.
- **Trees:** `io.output.tree(nodes)`.
- **Problems:** `io.output.problem(...)` and `io.output.present(data)`.
- **`CommandError`:** carries `why`, `fix`, `docs` and `detail`.

Output changes:

- Every failure now renders as one boxed problem. The stack, causes and raw detail show only under `--verbose`.
- The `--json` error gains `why`, `fix` and `docs`.
- Table and checklist rows are the `--json` data, extra fields kept.
- A non-zero exit without an error writes `{ "ok": false, "data": ... }`.
- Data a command returns without writing is presented.
- Warning and error lines use `⚠` and `✗`.
- `displayWidth` counts a text-presentation pictograph (`⚠`) as one column.

`CommandStructure`, `CommandField`, `ValueKind`, `NoteTone`, `Spinner` and `Progress` move to
`@stackra/console/contracts`.
