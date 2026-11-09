---
"@stackra/repo-checks": patch
---

`REVIEWED_ANONYMOUS_SURFACES` records Figentra Notify's marketing opt-out link (`preferences.opt_out.apply@1`) as
reviewed: a signed single-use token is its only input and credential, it only records an opt-out in the token's tenant,
and 30 calls a minute bound it.
