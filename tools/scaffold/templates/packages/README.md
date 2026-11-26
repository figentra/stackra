# Package templates

| Kind      | Lands in                         | Name                       | Tier          | Shape                                                        |
| --------- | -------------------------------- | -------------------------- | ------------- | ------------------------------------------------------------ |
| `package` | `packages/{{CATEGORY}}/{{NAME}}` | `@stackra/{{NAME}}`        | `tier:lib`    | v3: `stackra.config.ts`, `src/node/{{NAME}}.module.ts`, entries |
| `tooling` | `packages/tooling/{{NAME}}`      | `@stackra/{{NAME}}-config` | `tier:config` | presets that ship data; `.`, `./base`; exempt from v3 (R12)  |

`package/` is the base every library gets, in the programming model v3 shape (ADR 0294 rule R12, decision 15):
`stackra.config.ts`, `assets/` (`public/`, `lang/`), `src/config/{{NAME}}.config.ts` (the Config class), `src/contracts/`
(the leaf), `src/core/`, `src/node/{{NAME}}.module.ts` (the one root module) and `src/testing/`, each test in
`__tests__/`.

No entry barrel and no tool config is authored: the barrels, `tsdown.config.ts` and `vitest.config.ts` are generated
(ADR 0294 decision 15, ADR 0295 decision 5). `stackra new` writes each `exports` key naming its entry's one public
file: `.` is the config class (a `Config` kind over `src/core/schemas/{{NAME}}-options.schema.ts`, so a host
subclasses it, ADR 0294 decision 19) and `./node` is the root module (a `Module` kind); `./assets/*` exports the static
files. `contracts/` and `testing/` hold a README and are exported with their first file. In a product repository the
member takes the product's package name and catalogs (STA-1954).

`entries/<entry>/` adds an optional entry (`react`, `native`) with `--entries react,native`. `data/` adds the module's
`src/node/database/{migrations,factories,seeders}/` with `--data`, for a package that owns models.
