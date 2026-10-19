# Service templates

Templates for units of the one Encore app (`services/`, `@stackra/backend`). A service is not a workspace
member: the scaffold drops it into `services/src/<name>/`, where the app's `encore run`, `encore test`,
typecheck and lint already pick it up.

| Kind     | Lands in                 | Gives you                                                                    |
| -------- | ------------------------ | ---------------------------------------------------------------------------- |
| `encore` | `services/src/{{NAME}}/` | `encore.service.ts`, a public `GET /<name>/status`, its test, README, AGENTS |

Tokens: `{{NAME}}` (kebab, also the Encore service name and the path prefix) and `{{DESCRIPTION}}`. Replace
only these exact tokens — the TypeScript sources may contain other `{{ … }}` text.

After scaffolding, follow the service checklist (`~/.claude/rules/service-checklist.md`): add `db.ts`,
`events.ts`, `jobs.ts` only when the primitive exists, and switch new endpoints to `auth: true`.
