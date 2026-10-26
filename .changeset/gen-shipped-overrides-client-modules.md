---
"@stackra/gen": minor
---

Read the shapes the OS gen pass refused and give apps their client modules and permission sets.

- A field typed with a `@stackra/*` class, interface, alias or union whose package ships `<Type>$` reads as the new
  `shipped` shape kind, imported back from that package (STA-1290). The `X$` is also found in the barrels of a
  declared package the program never loaded, so a member importing only `@stackra/contracts` finds `ScopeRef$` in
  `@stackra/validation`.
- A package config override (`class ScopeConfig extends BaseScopeConfig`) takes each field's type and rules from the
  base's `Config({ schema })` options class and reads `...this.<field>` as that class's default. `Object.freeze(...)`,
  a shared `const` with a constant initializer, and `I18n.<namespace>.<path>` read as constants.
- `#stackra/clients/<service>` matches the producer's manifest member in snake or kebab case
  (`compliance-privacy` finds `compliance_privacy`).
- The generated client also exports one `moduleRef` client module per producer module (`ReviewsModule`) and one
  `permissionsRef` set per Permissions class (`ReviewPermissions.moderate`). The manifest records each permission's
  `class`.
- Gen writes a root `vitest.config.ts` shim that re-exports `.stackra/vitest.config.ts`, so `vitest run` loads the
  generated setup; an authored root file is refused (`shim_authored`), never overwritten.
- Every generated file, not only clients and schemas, is refused when it imports a `@stackra/*` package the member
  does not declare (`generated_dependency_missing`).
