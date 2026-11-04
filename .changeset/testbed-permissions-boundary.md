---
"@stackra/infra-testbed": patch
---

`awsTestbed` takes an optional `permissionsBoundary` and sets it on the box's and Image Builder's roles; the Pulumi
program reads it from the `permissionsBoundary` config key.
