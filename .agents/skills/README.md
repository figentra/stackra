# `.agents/skills/`

Invocable skills, one folder per skill with a `SKILL.md` (Agent Skills format: `name` and `description` frontmatter,
then the instructions). `pnpm agents:sync` symlinks each folder into `.claude/skills/`; OpenCode reads this folder
directly. The spec-kit skills (`speckit-*`) are not here: spec-kit renders them into `.claude/skills/` and
`.opencode/commands/` (see [`../speckit`](../speckit)).

| Family                 | Skills                                                                                                                      |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Monorepo and release   | `pnpm`, `turborepo`, `changesets`, `vitest`, `tdd`                                                                          |
| Web UI                 | `heroui-react`, `frontend-design`, `accessibility`, `playwright-best-practices`                                             |
| Mobile                 | `heroui-native`, `react-native-best-practices`, `expo-*` (animation, data-fetching, design-system, dev-client, upgrade), `eas-*` (app-stores, update, workflows) |
| Services and vendors   | `resend` (behind the mail driver), `stripe-best-practices` (billing work only)                                              |
| House                  | `docs-adr` (write or supersede an ADR in the house format)                                                                  |

## Rules

- Upstream skills are vendored content: do not edit one in place. Re-vendor it deliberately from its source, or write
  a house skill beside it. Upstream licence files stay in the skill folder.
- The Encore skills are not here. They teach hand-written Encore.ts, which this repository rejects for authors (Encore
  is only the generated target in `.stackra/encore/`, [ADR 0124](../../apps/docs/src/adr/0124-encore-is-the-generated-runtime-target.mdx)),
  so they are fenced in [`../reference/encore`](../reference/encore), read only by `compiler-engineer` (ADR 0258).
- A skill that names rejected technology fails `pnpm agents:check` unless `SKILL_TECH_ALLOWED` in
  `tools/scripts/agents-sync.mjs` records why the mention is harmless (ADR 0258). Where a skill and
  [`AGENTS.md`](../../AGENTS.md) disagree, `AGENTS.md` wins.
- oxfmt and oxlint skip this folder and `../reference` (`.oxfmtrc.jsonc`, `.oxlintrc.jsonc`, `lefthook.yml`).
- Retired (ADR 0258): `encore-getting-started`, `encore-migrate`, `encore-frontend`, `sanity-best-practices` (Sanity is
  dropped, ADR 0114) and `typescript-patterns` (its alias rule contradicts ADR 0233).

Docs: [skills](../../apps/docs/src/agents/skills.mdx).
