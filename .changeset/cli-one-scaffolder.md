---
"@stackra/cli": minor
---

`stackra new service` is the one service scaffolder (ADR 0500 decision 4). It writes the root module
`src/<name>.module.ts` and one passing `createTestingModule` test beside today's files, and no tool config, so
`pnpm install`, `stackra gen` and `stackra test` pass with no hand edit. `--data` adds the database test peers,
`@stackra/testing`, an example module (model, migration, a PGlite unit test and one `.int.test.ts`) and a `test:int`
script. `--repo <path>` names the workspace for every kind; a service written into a folder with no
`pnpm-workspace.yaml` also gets a minimal workspace root (catalogs, `stackra` pinned to the CLI's version, an
`.npmrc` for the Stackra registry). `--over` never writes or diffs under `src/`. `stackra test --tier int` runs the
integration tier of a package or service. The old `tools/scaffold` service template and its `service` kind are
removed.
