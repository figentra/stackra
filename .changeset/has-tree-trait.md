---
"@stackra/model": minor
"@stackra/database": minor
---

Add the `HasTree` trait (ADR 0321, data-layer gap mo16): `parentId` and an `ltree` `treePath`, a new system field.
`@stackra/database` keeps the path with `TreeSubscriber` on create, reads `children`, `ancestors` and `descendants` on
`CrudService`, moves a subtree with `CrudService.move(id, parentId)` (the `repath` prefix rewrite on `treePath`), refuses
`parentId` in `update`, `updateWhere` and `upsert`, and adds the blueprint macro `t.tree()` (`parent_id`, `tree_path`
with a GiST index).
