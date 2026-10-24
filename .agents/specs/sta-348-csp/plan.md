# Plan: `@stackra/csp` wave 2

**Spec**: `.agents/specs/sta-348-csp/spec.md`

## Design

- `src/core/schemas/csp-options.schema.ts`: `CspOptions extends Schema` with the four fields; registers
  `CSP_OPTIONS_SCHEMA` (`src/core/constants/csp-options-schema.constant.ts`) on load, as `TableInput` does.
- `src/config/csp.config.ts`: `CspConfig extends Config({ schema: CspOptions })`, no env map (origins from env reach
  the policy through `CspAdditions.connect`).
- `src/core/constants/csp-baseline.constant.ts`: the twelve directives in header order. Inline `style`
  attributes are allowed (`style-src-attr`) because server-rendered React markup carries them; `<style>` elements
  stay nonce-only.
- `src/core/constants/csp-source-pattern.constant.ts` and `csp-nonce-pattern.constant.ts`: the two grammars.
- `src/core/functions/csp-source.function.ts` (internal): checks a source and reduces a URL to scheme and host.
- `src/core/functions/content-security-policy.function.ts`: baseline plus additions, deduplicated per directive.
- `src/core/functions/csp-header-name.function.ts`, `create-nonce.function.ts`.
- `src/react/nonce/`: `NonceContext` (internal), `NonceProvider`, `NonceProviderProps`, `useNonce` (no throw outside
  a provider). `src/react/style/`: `Style`, `StyleProps`.
- Stand-in barrels `src/core/index.ts` (`.`, re-exports `#config/csp.config`) and `src/react/index.ts`.

## Constitution check

- Boundaries: runtime imports `@stackra/config`, `@stackra/validation`, `zod`, React (optional peer); dev-only
  `@stackra/testing` and the presets. `@stackra/contracts` for `definePackage`.
- Versions: catalogs and `workspace:*` only.
- Naming: function components for the Provider and `Style`, as `ContainerProvider` (the `Component` class base is
  gen's, app-side); Props in their own files (ADR 0305 rules 10 to 12).
- Not added (no consumer): `strict-dynamic`, a `report-uri`/`report-to` endpoint, script/style/font additions, a
  `frame-ancestors` addition.
