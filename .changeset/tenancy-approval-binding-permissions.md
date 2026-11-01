---
"@stackra/tenancy": patch
---

Add `ApprovalBindingPermissions` with `prune = Permission.L4.system()` (`tenancy.approval_binding.prune`), which clears
gen's `permission_unknown` for `PruneApprovalBindingsAction` (STA-1890, ADR 0513).
