---
"@stackra/mcp": minor
---

Add the hosted MCP server core: `toolTable` builds the tool table from committed manifests with inlined input schemas
and derived annotations, `filterTools` applies one caller's permissions and the tenant's entitlements, and
`protectedResourceMetadata` and `wwwAuthenticate` publish the endpoint as an RFC 9728 protected resource.
