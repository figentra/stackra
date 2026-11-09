---
"@stackra/app": minor
"@stackra/gen": minor
---

API keys reach the action pipeline: `CallAuthenticator` verifies a bearer that is an API key with identity's
`ApiKeyVerifierService` and answers its principal as an `api_client` actor with the key's call options
(`KeyCallOptions`: credential, origin, sandbox for a test key); a forwarded user token beside a key is refused.
`serveGuardedCall` reads `Origin` for it and hands the options to `execute`, and gen's adapters pass them to
`ActionPipeline#execute`. Run `stackra gen` after upgrading.
