---
"@stackra/iam": minor
---

Add the `RoleGrants` port to `@stackra/iam/contracts` (STA-1586): `grant(principal, grant)` gives a principal one role
at one scope node unless already held and answers whether it wrote. The IAM service that owns grants binds it; it is
the write half of the operator bootstrap. No driver ships here.
