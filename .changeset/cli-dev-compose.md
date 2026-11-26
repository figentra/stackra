---
"@stackra/cli": minor
---

`stackra dev` starts the dev compose before the member: it writes `.stackra/dev/compose.yaml` (and
`compose.shared.yaml` for `perLane: false` blocks, ClamAV by default) from the root runway's
`environments.dev.infra` and runs `docker compose up --detach --wait`, so Valkey, SeaweedFS, Mailpit, ClamAV and
otel-lgtm are healthy before `encore run`. The member's run gets their variables unless the shell or
`.stackra/dev-secrets.json` sets them. `--infra <name>[,<name>]` adds `when: opt-in` blocks and `--no-infra` skips the
step; `stackra dev secrets init` lists the names the dev compose provides apart from those that need a value
(STA-2664).
