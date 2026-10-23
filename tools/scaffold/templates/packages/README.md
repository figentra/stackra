# Package templates

| Kind      | Lands in                         | Name                       | Tier          | Shape                                                        |
| --------- | -------------------------------- | -------------------------- | ------------- | ------------------------------------------------------------ |
| `package` | `packages/{{CATEGORY}}/{{NAME}}` | `@stackra/{{NAME}}`        | `tier:lib`    | v3: `stackra.config.ts`, `src/node/{{NAME}}.module.ts`, entries |
| `tooling` | `packages/tooling/{{NAME}}`      | `@stackra/{{NAME}}-config` | `tier:config` | presets that ship data; `.`, `./base`; exempt from v3 (R12)  |

`package/` is the base every library gets, in the programming model v3 shape (ADR 0294 rule R12, decision 15):
`stackra.config.ts`, `src/config/{{NAME}}.config.ts` (the Config class), `src/contracts/` (the leaf), `src/core/`,
`src/node/{{NAME}}.module.ts` (the one root module) and `src/testing/`, each test in `__tests__/`.

No entry barrel is authored: the barrels are generated (ADR 0294 decision 15). Until gen ships (STA-339),
`scaffold.mjs` writes each `exports` key and tsdown entry (`{{ENTRIES}}`) naming its entry's one public file: `.` is
`src/core/constants/package-name.constant.ts` and `./node` is the root module. `contracts/` and `testing/` hold a
README and are exported with their first file.

`entries/<entry>/` adds an optional entry (`react`, `native`) with `--entries react,native`. `data/` adds the module's
`src/node/database/{migrations,factories,seeders}/` with `--data`, for a package that owns models.
