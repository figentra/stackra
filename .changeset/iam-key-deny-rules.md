---
"@stackra/iam": minor
---

A tenant's deny rules bind an API key's caller: `PolicyDecisionPointService.denied` checks the deny rules of a
principal's own snapshot (breakable ones too), and `IamAccessControlDriver` runs it for an `api_client` call after its
scopes pass, in `require` and against the record in `authorize`. A key principal with no published snapshot is refused.
