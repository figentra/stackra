---
"@stackra/cli": patch
---

`stackra consumer-gate` now runs the `scaffold` consumer instead of refusing it: with `--checkout` at the starter
templates pin, cores own built CLI makes the app with `stackra create --starter --tarballs` (files only), adds a
service with `stackra new service --data`, copies the matrix fixture into it and gates the app in pack mode. Matrix
entries carry a `pinned` date and the summary flags a pin older than 14 days as stale; `--product <name> --pin`
prints `<repo> <ref>` so a workflow checks out the pinned commit.
