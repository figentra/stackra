---
"@stackra/gen": minor
---

Add the client tool target (STA-1631, ADR 0490): `emitClientTools` writes `#stackra/client-tools` for an app from its
routes, the panel resources of its dependency manifests, placed action prefills, theming previews, tours and anchors,
grouped by declaring module. Refuses `client_tool_collision`, `prefill_tool_off`, `anchor_undeclared` and
`context_record_not_public_id`. Adds `anchors` and `anchorReferences` to `MemberIR`, read by `readAnchors`.
