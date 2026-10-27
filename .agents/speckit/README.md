# `.agents/speckit/`

The only source of the Stackra spec-kit preset, `presets/stackra/`
([ADR 0121](../../apps/docs/src/docs/adr/0121-sdlc-tooling-roles-and-linear.mdx) D15).

| Path                         | Holds                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| `presets/stackra/preset.yml` | the preset manifest                                                                                     |
| `presets/stackra/commands/`  | the wrapped `speckit.*` commands: spec location, stage gates, Linear sub-issues, generated constitution |
| `presets/stackra/templates/` | the spec, plan and tasks templates                                                                      |

## Rules

- Edit here, then run `pnpm speckit:sync`. It installs the preset into `.specify/presets/stackra/` and re-renders the
  OpenCode and Claude copies (`.opencode/commands/speckit.*`, `.claude/skills/speckit-*`), which are committed.
- `pnpm validate` (the `spec-gate ci` tripwire) fails when the installed copy differs from this source.
- Every folder under `presets/` is read as a preset, so keep documentation in this file, not there.

Docs: [spec lifecycle](../../apps/docs/src/docs/agents/spec-lifecycle.mdx).
