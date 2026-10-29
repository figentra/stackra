---
"@stackra/infra-identity": minor
---

Add the Apple identity provider. The seed's optional `appleSignIn` block (team id, services id, key id, and the name of
the `.p8` key's stack config secret) puts it on `IdentityPlan.appleSignIn`; `identityStack` then creates it through
ZITADEL's admin API, allows it on the default login policy and exports its id as `appleIdp`. Off without the block.
