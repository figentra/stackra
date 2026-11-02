---
"@stackra/tenancy": minor
"@stackra/showcase": patch
---

Four more tenancy kit blocks in `@stackra/tenancy/react`: `TenantPicker` (choose an organisation, by default from the
signed-in person's memberships), `MemberPicker` (choose a member, from the host's search), `OrganizationPage` (read and
save the organisation's profile, list its legal entities and domains) and `MembersPage` (list members, change a role,
remove a member, invite, and list and revoke invitations, with the host's words for the last-owner and external-role
refusals). The pages talk to the server through two new client ports in the new `@stackra/tenancy/contracts` entry,
`TenantProfile` and `TenantMembers`, with memory drivers in `./testing`; the root entry adds the `LastOwnerRefusedError`
and `ExternalRoleNotAllowedError` refusals. Every word comes from the host in `labels`. The showcase lists the four
under Blocks.
