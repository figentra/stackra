---
"@stackra/runway": minor
---

Add the template line step: `checkoutLine` resolves a root runway line (`os/mobile@3`) to the highest release of its
package on the registry (`<scope>/<owner>-<name>@<major>.x.y`, ADR 0481) or a local checkout and unpacks it into a
folder, optionally as a git checkout; `shellReleaseOf` answers a checked-out shell's edge release from its
`dist/shell.json`. `runMobileJob` takes `line` to check the template out itself and commit the config it writes, and
`sha` is optional then. `expoConfigOf` writes the enabled flags to `extra.capabilities`. Dry runs: `dryRunCommand`
records every command and `DryRunEdgeKvDriver` keeps the KV rows in memory.
`prepareMobileDev` prepares a product mobile app's local run: the template line checked out into
`.stackra/mobile/<app>`, its config and capabilities written, the product packages' `./native` entries listed for the
template and its installed `node_modules` linked.
