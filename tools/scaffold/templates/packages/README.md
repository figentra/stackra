# Package templates

| Kind      | Lands in                         | Name                       | Tier          | Shape                                                       |
| --------- | -------------------------------- | -------------------------- | ------------- | ----------------------------------------------------------- |
| `package` | `packages/{{CATEGORY}}/{{NAME}}` | `@stackra/{{NAME}}`        | `tier:lib`    | entries-first: `src/core` (`.`) plus the chosen entries     |
| `tooling` | `packages/tooling/{{NAME}}`      | `@stackra/{{NAME}}-config` | `tier:config` | presets that ship data; `.`, `./base`                       |

`package/` is the base every library gets: `src/core/` for `.`, `config/{{NAME}}.config.ts` and `resources/`
outside `src/`. `entries/<entry>/` adds one optional entry (`contracts`, `node`, `react`, `native`, `testing`, `devtools`);
`pnpm new package <name> --entries contracts,node` copies them and writes the `exports` keys. The tsdown entry map
is the `{{ENTRIES}}` token. ADR 0126 replaces the earlier domain/platform/lib archetypes.
