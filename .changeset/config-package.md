---
"@stackra/config": minor
---

Add `@stackra/config`, configuration classes of the programming model v3.1: the called-only kind base
`Config({ schema, env })` whose class is the DI token and whose schema fields are typed on the class, host overrides
under the `Base<Name>` alias, `configKey` (the key derivation gen shares), `@Secret("NAME")` on schema, integration and
connection fields resolved blind through the `SecretStore` port and never serialised, `buildConfig` with the fixed
layers (schema defaults, host override, env, runway values, secrets) validated and frozen, `ConfigInvalidError` naming
paths, variables and secrets but never values, `hydrateEnv` for the public part (`PublicPart`, `BuildFacts`) or the
whole env instance, the `env` value parsers folded in from the old `./env` entry; `./react` with `useConfig`; and
`./testing`, which adds `.withConfig(Class, values)` and `.withSecrets(map)` to the testing module.
