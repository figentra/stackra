---
"@stackra/ui": minor
"@stackra/ai": minor
---

`@stackra/ui` adds `ApprovalCard`, a tool call that waits for a person: what will run, its input and risk, and Approve
and Deny until it is answered or expires. `@stackra/ai`'s `ChatSurface` now also draws a turn's AI SDK UI message parts
in order (text, reasoning, sources, a tool approval as an `ApprovalCard`, and each `data-tamo-<kind>` part through the
host's `renderers`), and `./contracts` adds the typed data of Tamo's chat parts (`TamoPartKind`, `TamoPartData`).
