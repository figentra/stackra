# AGENTS — @stackra/vite-plugin

The Stackra Vite preset (ADR 0261 decision 4, ADR 0295 decision 5, ADR 0305 rule 40). Member at
`packages/developer/vite-plugin` (`tier:lib`). One entry, `.`, Node only (ADR 0127, 2026-10-24 note).

## Where code goes

| You are writing…                         | It goes in…                                 |
| ---------------------------------------- | ------------------------------------------- |
| A plugin or a helper that builds plugins | `src/core/functions/<name>.function.ts`     |
| A type                                   | `src/core/types/<name>.type.ts`             |
| A test                                   | `__tests__/<name>.<kind>.test.ts` beside it |

## Rules

- The class-component pass is gen's (registry A14). Wire it; never copy or fork it.
- The `#stackra/*` plugin is a thin view of `.stackra/gen/` (ADR 0261): it adds no export and never generates.
- Every option value comes from gen. Add an option only when gen writes it, and give it a real effect.
- Load a framework plugin only where it is used (dynamic import), so a single-page app never imports the Worker or
  React Router plugins.
- Never read or pass a secret: the Sentry plugin reads its token from the release job's environment itself.

## PII

None. A Vite config holds paths, public vars and project names.
