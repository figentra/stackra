# `packages/tooling/`

The shared configuration presets every member extends, tagged `tier:config`. They have no workspace dependencies and
sit at the bottom of the dependency graph ([ADR 0003](../../apps/docs/src/docs/adr/0003-tier-dependency-direction.mdx)).

| Package                    | Presets for                                                                      |
| -------------------------- | -------------------------------------------------------------------------------- |
| [`typescript`](typescript) | `@stackra/typescript-config`: tsconfig presets (`base`, `node`, `library`, …)    |
| [`oxlint`](oxlint)         | `@stackra/oxlint-config`: oxlint presets, including the boundaries rules         |
| [`vitest`](vitest)         | `@stackra/vitest-config`: vitest presets and the coverage helper                 |
| [`tsdown`](tsdown)         | `@stackra/tsdown-config`: the `library()` build preset                           |
| [`commitlint`](commitlint) | `@stackra/commitlint-config`: conventional commits and the `refs-issue-key` rule |

## Rules

- A preset is a plain file in the package's `src/`, so imports here keep full specifiers. There is no `src/lib/` layer.
- The TypeScript and oxlint presets ship their JSON and JSONC files as they are. The vitest, tsdown and commitlint
  presets build `src` to `dist/*.js` and `.d.ts` with `tsc -p tsconfig.build.json`, because Node strips no types under
  `node_modules`. Their `exports` list `@stackra/source` first, so typecheck reads `src`; a config file that a tool
  loads (`vitest.config.ts`, `tsdown.config.ts`) reads `dist`, which `^build` makes first. commitlint reads `src`
  through `NODE_OPTIONS=--conditions=@stackra/source` in lefthook and the Quality Gate ([ADR 0025](../../apps/docs/src/docs/adr/0025-packages-publish-to-private-registry.mdx)).
- Every compiler or lint option lives here with its reason; a member's config only extends a preset.
- Changing a preset changes every member: run `pnpm verify`.
- Create one with `pnpm new tooling <name> --description "<one sentence>"`.

Guide: [tooling](../../apps/docs/src/docs/guides/tooling.mdx).
