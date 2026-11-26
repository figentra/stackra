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

This is the first part of the check, not the whole of it. Nothing calls `canViewAttachment` yet, and nothing
routes a parent's model key from the files service to the service that owns the model, so an attachment is still
served without its parent being checked until that lands. gen emitting the canView contract query per
`HasAttachments` model, the files-side driver that routes by model key (an unknown key refuses), and the files
service calling the check are STA-2833.
