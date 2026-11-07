---
"@stackra/runway": patch
---

`publishProduct` requires canary scopes only in production. D6 stages a release for real tenants first, so a dev or
staging publish without `canaryScopes` now writes the `release:` pointer directly instead of refusing. Production
still refuses without them unless the release is marked first.
