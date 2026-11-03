---
"@stackra/cli": minor
---

`stackra testbed run --serve <surface>` builds the product's surfaces, starts the generated Encore app, seeds the `test` profile, serves the surface with `stackra preview serve` and runs the command against it with `STACKRA_E2E_BASE_URL` set, in the heavy slot.
