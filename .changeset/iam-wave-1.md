---
"@stackra/iam": minor
"@stackra/showcase": patch
---

The IAM kit's first blocks (ADR 0504) in `@stackra/iam/react`. `Can` shows its children only while the signed-in
session holds a permission (all or any of several, read through `usePermission`), with a `fallback` otherwise.
`RolePicker` is a single-choice `EntityPicker` of roles whose `loadOptions` the host binds. `RolesPage` shows the
built-in roles read-only and the custom roles editable on `PermissionsMatrix`, and saves through `onSave`. Every word
comes from the host in `labels`. The showcase lists the three under Blocks.
