---
"@stackra/cli": minor
---

`stackra doctor`, `stackra dev --tunnel` and `stackra new service` no longer send people outside Figentra to
Figentra's own tools and repositories. Doctor finds a tool on `PATH` itself instead of running `which`, so it works on
Windows (the `Path` key and `PATHEXT` extensions), where every tool used to read as installed (there was no `which` to ask). The network row's fix
names the connection, a proxy, a VPN or a firewall instead of one VPN product; the `@figentra` registry row says to add
a read token for the registry to the user-level `~/.npmrc`; the secrets rows are `sops CLI`, `Google login for sops`
and `secrets checkout` (renamed from `figentra/secrets clone`, still under `STACKRA_SECRETS_DIR` or
`~/.stackra/secrets`). `stackra dev --tunnel` asks for `CLOUDFLARE_TUNNEL_TOKEN` in the environment, set for that one
run, and a new service's `runway.yaml` header says secret values come from your secret store through runway.

A starter profile in `stackra.starter.yaml` can now list `exclude` globs: files its `include` globs match that
`stackra create` leaves out (the starter repository's own release or approval workflows). An overlay is still written
over an excluded path.
