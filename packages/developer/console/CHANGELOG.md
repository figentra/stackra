# @stackra/console

## 0.5.0

### Patch Changes

- @stackra/container@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/validation@0.5.0

## 0.4.0

### Minor Changes

- 9c8d108: Packages contribute console commands, and gen collects them per member (STA-1731). `@stackra/console` audits a
  command declared `audit: true` through the `CommandAudit` port (refused before it runs when no sink is ready; secret
  values redacted). gen records commands in the manifest, merges hosted packages' commands, refuses
  `command_collision`, and writes `#stackra/commands` and a console entry that `stackra console <member>` runs. First
  commands: `db:migrate`, `db:rollback`, `db:status`, `db:seed`, `tenant:list`, `tenant:create` (with a
  `TenantDirectory` port), `cache:clear` (the `Cache` port gains `flush`), `queue:work`, `queue:failed` and
  `queue:retry`; `@stackra/access-log` stores command audit entries (`STACKRA_COMMAND_AUDIT_SCOPE`).
- 3c30885: Add `@stackra/console`: the `Command` kind with `@Argument` and `@Option` fields, `createConsole`, themed output
  (gradient banner, notes, tasks, spinners, progress, tables), prompts on `node:readline`, plain and `--json` modes,
  right-to-left-safe widths, the `runCommandForTest` harness and the `stackra-console create` scaffolder.
  `@stackra/validation` lets its field decorators mark commands.

### Patch Changes

- ef987d9: The LICENSE names the legal holder, Figentra Technologies L.L.C. (STA-1870).
- a8c358a: The audit-settle delay unrefs its timer by shape, so the file type-checks where `setTimeout` is the DOM `number` form.
- Updated dependencies [0b660e0]
- Updated dependencies [9c8d108]
- Updated dependencies [3c30885]
- Updated dependencies [c9cf778]
- Updated dependencies [1856ee0]
- Updated dependencies [ca7d004]
- Updated dependencies [eccdaf0]
- Updated dependencies [f8fe5a5]
- Updated dependencies [1856ee0]
- Updated dependencies [ff56870]
- Updated dependencies [e219411]
  - @stackra/validation@0.4.0
  - @stackra/contracts@0.4.0
  - @stackra/container@0.4.0

Written by Changesets on release; never edited by hand.
