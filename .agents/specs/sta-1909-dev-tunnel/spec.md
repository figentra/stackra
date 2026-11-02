# Feature Specification: `stackra dev --tunnel`

**Feature Branch**: `figentra/sta-1909-dev-tunnel`

**Created**: 2026-11-01

**Status**: Implementing <!-- assigned by the leader, 2026-11-01, after the ADR 0290 tunnel mapping -->

**Linear**: STA-1909

**Clarifications status**: complete

**Input**: ADR 0290 decisions 4 and 5: each machine runs a named Cloudflare Tunnel, started by `stackra dev --tunnel`; the
tunnel token comes from Infisical `/agents` through `infisical run` and never touches disk; the tunnel and its DNS are
made outside `stackra dev` (the core stack, or by hand while none runs), so the CLI only runs `cloudflared`. The
command has no `--tunnel` option today, and 0290's Enforcement line ("`stackra dev --tunnel` is checked by its own
tests") is unmet.

**Decisions (leader, 2026-11-01)**: the token is `CLOUDFLARE_TUNNEL_TOKEN` at Infisical `/agents`, one per developer
machine; the tunnel is named `figentra-<dev>`, with hosts `<member>-<dev>.figentra.cloud`; the first tunnel is made by
hand in the dashboard (no infrastructure repository yet). The tunnel's ingress lives in Cloudflare (remote config), so
the CLI needs no port mapping.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `packages/developer/cli` (the `dev` command and a new `dev-tunnel` folder)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: `CLOUDFLARE_TUNNEL_TOKEN`, by name only; read from the CLI's environment, handed to `cloudflared` in its
  environment as `TUNNEL_TOKEN`, never on argv, never written, never printed, and removed from the CLI's own environment
  so the member's dev processes do not inherit it
- **ADR needed**: no (ADR 0290 decisions 4 and 5)
- **New dependencies**: none (`cloudflared` is a developer tool on `PATH`, like `wrangler`)
- **Deploy modes**: none (local dev)
- **Licence tier**: free
- **Docs to update**: the CLI command's usage text
- **Lane**: lite
- **Change risk**: R1 (a developer command; handles a token by name)

## Requirements

- **FR-001** `stackra dev` takes `--tunnel` with every mode (the member tool, `--surface`, `--mobile`, `--product`). With
  it, the command starts `cloudflared tunnel run` beside the dev run and stops it when the dev run ends; the dev run's
  exit code is the command's.
- **FR-002** The token is `CLOUDFLARE_TUNNEL_TOKEN` from the environment. It reaches `cloudflared` only as `TUNNEL_TOKEN`
  in that child's environment, never as an argument; the CLI removes it from its own environment before the dev run
  starts. Without it, the command stops with a usage error that names the variable and says to start the command
  through `infisical run --env=dev --path=/agents`.
- **FR-003** A tunnel that exits on its own while the dev run goes on writes one line to stderr with its exit code; the
  dev run is not stopped.
- **FR-004** Unit tests cover FR-001 to FR-003 with an injected spawn (no real `cloudflared`).
