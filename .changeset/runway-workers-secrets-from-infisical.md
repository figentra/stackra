---
"@stackra/runway": minor
"@stackra/cli": minor
---

The Cloudflare Workers provider reads each Worker's secrets from Infisical (`readMemberSecrets`) when it is given the
runways, and sends them to `wrangler secret bulk` on stdin, after every value is read and before anything ships (STA-606).
`stackra deploy` gives it the runways when the root runway says `secrets.sync: on-deploy`; without them the provider
still reads the deploy job's environment.
