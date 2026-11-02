---
"@stackra/cli": minor
"@stackra/infra-testbed": patch
---

`stackra testbed` reaches the boxes by SSH through SSM Session Manager: `ssh` and `rsync` connect to
`ubuntu@<instance-id>` with an `AWS-StartSSHSession` `ProxyCommand`, so the security group needs no inbound rule and
a changing public IP (Cloudflare WARP) no longer breaks access. `--ssh-direct` (or `STACKRA_TESTBED_SSH_DIRECT=1`)
keeps the public-IP path with the port-22 allowlist swap. `awsTestbed`'s `allowedCidrs` is optional: absent or empty
means no ingress. The Session Manager plugin is pinned in `mise.toml`.
