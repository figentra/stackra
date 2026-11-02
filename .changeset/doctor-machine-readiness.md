---
"@stackra/cli": minor
---

`stackra doctor` checks the machine for what the workspace needs: mise tools, a running Docker engine, the network
(each address of each host on port 443, flagging edges that drop while sibling addresses answer, with a Cloudflare
WARP hint), the `@stackra` registry (and `@figentra` when used), GitHub, Encore, Pulumi, disk, free dev ports, and
Xcode with a simulator only for a mobile member. `--fix` offers each fix and runs it after a yes. `stackra dev` runs
the quick checks first and stops early with the fix when the machine is not ready.
