---
"@stackra/runway": patch
---

The secret sync writes Encore secrets from a temporary folder holding only `encore.app` with the root runway's
`providers.encore.app`, instead of `<repo>/.stackra/encore`, which gen never writes (the generated app sits under each
service member, and the deploy commit roots it at the repository). tamo's staging sync failed with ".stackra/encore
does not exist". A runway without an Encore app id is refused before anything is written (STA-2193).
