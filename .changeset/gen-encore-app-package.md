---
"@stackra/gen": patch
---

A generated Encore app can now be checked and built. Gen writes `.stackra/encore/package.json` (private, ES modules)
beside `encore.app`, since Encore reads the app root's `package.json` to start (`encore check` failed with "failed to
read package.json"). It also copies the compiled migrations under the Encore service and declares
`migrations: { path: "./migrations" }`, because Encore takes only a local relative migrations path in the object form.
