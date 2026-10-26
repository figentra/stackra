---
"@stackra/mcp": minor
---

Serve `ui://` resources (MCP Apps): `toolTable` carries a tool's resource into its descriptor `_meta`, and
`uiResourceTable`, `uiResourcesFor` and `uiResourceContents` read the manifests' `uiResources`, list the ones a caller's
tools name, and answer a read with the bundle and its frame policy (STA-784, ADR 0348).
