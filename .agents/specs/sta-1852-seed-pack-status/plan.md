# Plan: rename db:seed to seed-pack:status (STA-1852)

1. Move `db-seed.command.ts` and its test to `seed-pack-status.command.ts`; rename the class and the command name.
2. Update the `./node` barrel, its export test and its docblock.
3. Update the committed `stackra.manifest.json` entry by hand (gen runs on the testbed; `gen --check` confirms it).
4. Add a minor changeset for `@stackra/database` (a renamed command). Tests run in CI.
