# `.agents/skills/`

Invocable skills, one folder per skill with a `SKILL.md` (Agent Skills format: `name` and `description` frontmatter,
then the instructions). `pnpm agents:sync` symlinks each folder into `.claude/skills/`; OpenCode reads this folder
directly. The spec-kit skills (`speckit-*`) are not here: spec-kit renders them into `.claude/skills/` and
`.opencode/commands/` (see [`../speckit`](../speckit)).

| Family                 | Skills                                                                                                                      |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Encore (generated app) | `encore-*` (api, architecture, auth, bucket, cache, code-review, cron, database, frontend, getting-started, logging, migrate, pubsub, secret, service, testing, webhook) |
| Monorepo and release   | `pnpm`, `turborepo`, `changesets`, `vitest`, `tdd`, `typescript-patterns`                                                   |
| Web UI                 | `heroui-react`, `frontend-design`, `accessibility`, `playwright-best-practices`                                             |
| Mobile                 | `heroui-native`, `react-native-best-practices`, `expo-*` (animation, data-fetching, design-system, dev-client, upgrade), `eas-*` (app-stores, update, workflows) |
| Services and vendors   | `resend`, `stripe-best-practices`, `sanity-best-practices`                                                                  |
| House                  | `docs-adr` (write or supersede an ADR in the house format)                                                                  |

## Rules

- Upstream skills are vendored content: do not edit one in place. Re-vendor it deliberately from its source, or write
  a house skill beside it. Upstream licence files stay in the skill folder.
- The Encore skills describe Encore.ts itself. In this repository Encore is only the generated target in
  `.stackra/encore/`: never write `encore.dev` imports in a service or package
  ([ADR 0124](../../apps/docs/src/adr/0124-encore-is-the-generated-runtime-target.mdx)). Where a skill and
  [`AGENTS.md`](../../AGENTS.md) disagree, `AGENTS.md` wins.
- oxfmt and oxlint skip this folder (`.oxfmtrc.jsonc`, `lefthook.yml`).

Docs: [skills](../../apps/docs/src/agents/skills.mdx).
