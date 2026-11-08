---
"@stackra/integrations": minor
---

`./testing` adds `liveConnection(ConnectionClass, { integration, fields, secrets })`: a connection whose `api` is the
real managed client (the Integration's auth, base URL, headers, retry and rate limits over memory stores and the system
clock), so a connector certification suite in a product can run a connector against a provider sandbox without a
service or a ConnectionStore.
