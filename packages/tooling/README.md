# `packages/tooling/`

The shared configuration presets every member extends, tagged `tier:config`. They have no workspace dependencies and
sit at the bottom of the dependency graph ([ADR 0003](../../apps/docs/src/adr/0003-tier-dependency-direction.mdx)).

| Package                    | Presets for                                                                   |
| -------------------------- | ----------------------------------------------------------------------------- |
| [`typescript`](typescript) | `@stackra/typescript-config`: tsconfig presets (`base`, `node`, `library`, …) |
| [`oxlint`](oxlint)         | `@stackra/oxlint-config`: oxlint presets, including the boundaries rules      |
| [`vitest`](vitest)         | `@stackra/vitest-config`: vitest presets and the coverage helper              |
| [`tsdown`](tsdown)         | `@stackra/tsdown-config`: the `library()` build preset                        |

## Rules

- A preset is a plain file in the package's `src/`, loaded by plain Node or by the tool itself, so imports here keep
  full specifiers. There is no `src/lib/` layer.
- Every compiler or lint option lives here with its reason; a member's config only extends a preset.
- Changing a preset changes every member: run `pnpm verify`.
- Create one with `pnpm new tooling <name>`.

Guide: [tooling](../../apps/docs/src/guides/tooling.mdx).
