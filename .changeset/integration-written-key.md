---
"@stackra/integrations": patch
"@stackra/gen": patch
---

`Integration({ key })` takes an optional written key of two snake_case parts (`connectors.stripe`), for an Integration
whose key stored data already names (STA-1739). Gen's manifest uses it in place of the derived
`<module>.<snake(class)>`, refuses a malformed one (`integration_key_invalid`) and still refuses two Integrations with
one key (`identity_collision`). Without `key`, nothing changes.
