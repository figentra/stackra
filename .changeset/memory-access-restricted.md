---
"@stackra/actions": patch
---

The memory `AccessControl` refuses a restricted permission to a customer-realm user, as the policy decision point
does: a restricted permission counts only through an explicit grant (`grant(permission)` in a test). A test of a
staff-only read that is restricted now sees the shopper refused on memory drivers too.
