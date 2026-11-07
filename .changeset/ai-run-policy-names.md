---
"@stackra/ai": patch
---

Migration `ai.0006_rename_run_policies` renames the tenant policies of `ai.run_steps` and `ai.run_approvals` to
`pol_run_steps_tenant_id` and `pol_run_approvals_tenant_id`. 0005 renamed the tables but a rename keeps policy names,
so a host's generated tenant-isolation test read each table as missing its policy and carrying a second permissive one.
The rename keeps each predicate in place, so no table is ever without its policy.
