---
"@stackra/iam": minor
"@stackra/clients": patch
---

Add `@stackra/iam`: the `Permissions`, `Permission` (L0 to L4, `.system()`), `Policy<M>` and `Role({ grants })` kinds,
`Decision`, `Risk` and `SystemRole`, the embedded policy decision point (scoped grants that inherit downward, explicit
deny with `@stackra/rules` conditions and audiences that name `@stackra/segments`' `SegmentRef`, record
visibility and `visibleCondition`, the delegation bound), the action pipeline's
`AccessControl` driver, the scope package's `GrantedScopes` driver, the record-visibility query filter
(`IamVisibilityFilterDriver` for `@stackra/database`'s `VisibilityFilter` and `registerVisibility`, `./node`),
`usePermission` (`./react`) and `actors` (`./testing`); `@stackra/clients` types an action ref's `risk` as `Risk`.
