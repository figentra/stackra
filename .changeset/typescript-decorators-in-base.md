---
"@stackra/typescript-config": minor
---

The base preset, and so every preset, sets `experimentalDecorators: true` (and keeps `emitDecoratorMetadata: false`):
a member typechecks the decorated source of the workspace packages it imports through `@stackra/source`, so one on the
`library` or `node` preset no longer fails with TS1240 and TS1270 at core's option schemas and cursor and table inputs.
