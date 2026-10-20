# `.agents/specs/`

The spec-kit specs, one folder per Linear issue: `sta-<n>-<slug>/`
([ADR 0120](../../apps/docs/src/adr/0120-sdlc-spec-location-lanes-and-change-risk.mdx) D1). Lite- and full-lane work
starts here; bug and chore lanes need no spec.

| File       | Written by                             | Holds                                                                           |
| ---------- | -------------------------------------- | ------------------------------------------------------------------------------- |
| `spec.md`  | `/speckit.specify`, `/speckit.clarify` | the requirements (`FR-`, `SC-`), the Impact answers, `**Status**`, `**Linear**` |
| `plan.md`  | `/speckit.plan`                        | the design, the Constitution Check, deploy modes and properties (`P-`)          |
| `tasks.md` | `/speckit.tasks`                       | `T###` tasks with what they cover, their routes and dependencies                |

`**Status**` moves Draft → Clarified → Planned → Tasked → Implementing → Done (or Abandoned, Superseded).

## Rules

- The folder name comes from the branch's STA key (`node tools/scripts/spec-gate.mjs dir`); nothing auto-numbers, and
  root `specs/` is refused.
- `pnpm spec:gate` checks each stage's artifacts; `/speckit.plan` refuses until the spec passes. `pnpm spec:trace`
  maps every requirement to tasks and to tests tagged `@covers sta-<n>:FR-001`. Both run in `pnpm validate` for the
  folders a change touches.
- Specs are public: never put a secret, customer data or an unfixed vulnerability in one.

Docs: [spec lifecycle](../../apps/docs/src/agents/spec-lifecycle.mdx).
