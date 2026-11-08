---
"@stackra/settings": minor
"@stackra/gen": patch
---

A role-gated setting approval: `@Setting({ approval: { by: SystemRole.Owner } })` holds a change until someone holding
that role approves it, beside the existing four-eyes `approval: true`. The revision records the role (`approvalRole`,
migration `settings.0003_add_setting_revision_approval_role`); `SettingsResolver.approve(id, approver, roles)` refuses
an approver without it (`SettingApproverRoleError`, forbidden) and fails closed when the calling action passes no roles.
The role is the control, so its holder may approve a change they wrote; `decidedBy` records who did. One change needs
one approving role. Gen treats a role-gated key as approval-marked too.
