---
"@stackra/runway": minor
---

`./node` gains the publish step (ADR 0436, 0437; app-shells 4.2, 5.3, 15.7, 16.3, 16.4, 16.7). `publishProduct`
uploads each web surface's built extension bundle to R2, writes the platform `host:` rows (canonical host, D2) and the
app-link `wellknown:` files, and starts a `canary:` on the internal and demo scopes (D6), or writes `release:` on a
first release; it refuses a bundle whose `targets` the edge does not serve and an ops contribution without a second
reviewer. `publishShell` puts a shell release on the `shell:<surface>:<line>` canary list; `promoteCanary` promotes,
holds or rolls back a canary on its health (`canaryVerdict`: a timer alone never promotes);
`checkShellCompatibility` builds every product against the next shell's import map. `WranglerEdgeKvDriver` and
`EdgeKvConfig` write the edge KV copy; every threshold and window is in `EDGE_PUBLISH_SETTINGS`. Adds the
`@stackra/app` dependency for the `EdgeKvWriter` port.
