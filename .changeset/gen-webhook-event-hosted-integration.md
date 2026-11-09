---
"@stackra/gen": patch
---

A webhook event typed by an integration `import type`d from a hosted package's entry is now registered with that integration. For example: `WebhookEvent<QuiqupIntegration>`, with `QuiqupIntegration` from `@figentra/ship-connector-quiqup/node`.

Before this, the reader could not resolve the package's types and named the partner `unknown`. `registrations.ts` then imported `unknown` and registered `integration: undefined`, so no route or signature check was tied to the event. Nothing typechecks `.stackra/gen`, so it broke only at runtime: Ship's carriers and Pay's Stripe.

- The reader now takes the name from the import itself, using the exported name for an aliased import.
- gen refuses a partner it still cannot name, with `partner_unresolved`.
- The registrations emitter never imports `unknown`.
