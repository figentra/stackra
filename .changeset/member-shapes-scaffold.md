---
"@stackra/typescript-config": minor
---

Member shapes of ADR 0126. `@stackra/typescript-config`: the `./next` preset is removed (no Next.js apps), and the
`library` preset also typechecks `config/` beside `src/`. The example and health services declare their root module
in `package.json` `stackra.module`.
