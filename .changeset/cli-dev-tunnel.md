---
"@stackra/cli": minor
---

`stackra dev --tunnel` runs the developer machine's Cloudflare Tunnel beside any dev mode (STA-1909, ADR 0290 decisions 4
and 5). It starts `cloudflared tunnel run` and stops it when the dev run ends. The token is `CLOUDFLARE_TUNNEL_TOKEN`,
injected by `infisical run --env=dev --path=/agents`; it reaches `cloudflared` only as `TUNNEL_TOKEN` in that process's
environment, never on its command line, and the member's dev processes do not inherit it. Without the token the command
stops with a usage error. The tunnel (`figentra-<dev>`) and its hosts (`<member>-<dev>.figentra.cloud`) are made in
Cloudflare; the CLI passes no ingress config.
