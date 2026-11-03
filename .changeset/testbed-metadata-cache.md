---
"@stackra/infra-testbed": patch
---

The image keeps pnpm's metadata cache on `/data/pnpm-cache` beside the store. pnpm 12's release-age check reads each
package's metadata even for a lockfile install, and the image's Clean step empties `/root/.cache`, so the validate
phase's offline fetch failed (`ERR_PNPM_NO_OFFLINE_META`, image 1.224117217.0). The box agent's fetch fills the same
cache, and each job container mounts it and installs with `--prefer-offline`, so a package the store lacks is fetched
instead of failing the job. The pull-request check now empties the home cache as Clean does and runs a job install in
the job image against the store mounted read-only.
