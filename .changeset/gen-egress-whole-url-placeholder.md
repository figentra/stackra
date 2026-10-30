---
"@stackra/gen": patch
---

`egressOf` accepts a `baseUrl` that is exactly one camelCase `{field}` (STA-1665): the egress entry is
`{ origin: "{field}", fields: ["field"] }`, and the managed client checks the resolved URL at run time. Every other
refusal is unchanged.
