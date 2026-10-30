---
"@stackra/integrations": patch
---

A `baseUrl` may be exactly one `{field}` placeholder, so the whole URL comes from the connection or credential set
(STA-1665). The managed client accepts a resolved `http:` origin only on an `.internal` host (the private tools
namespace, until TLS there, STA-1653); any other resolved origin must be https.
