---
"@stackra/model": minor
---

An attachment of a `HasAttachments` record can now be checked against its parent record before it is served
(STA-1960, ADR 0333 2026-10-24 amendment). The record's owning service binds the new `AttachmentParentVisibility`
port; the files service calls `canViewAttachment(visibility, file.parent, actor, cache?)` after its own tenant and
scope checks. It fails closed: no bound driver, or any answer but `true`, refuses, a driver's error propagates, and a
parent that is not a `<module>.<model>` key with a public id throws. `AttachmentVisibilityCache` keeps answers per
parent and per whole actor chain for at most 60 seconds, shares a question in flight, never keeps a failed one, and
`forget(parent)` drops a parent's answers. New types: `AttachmentParent`, `AttachmentVisibilityCacheOptions`.
