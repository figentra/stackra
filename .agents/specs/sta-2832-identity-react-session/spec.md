# Feature Specification: the session alone for React, with no `@stackra/ui`

**Feature Branch**: `figentra/sta-2832-identity-react-session`

**Created**: 2026-11-26

**Status**: Implementing

**Tier**: feature

**Approver**: CTO (a new public entry of a library package)

**Linear**: STA-2832

**Clarifications status**: complete

**Input**: `@stackra/identity/react` re-exports `useSession` and `SessionGate` beside the identity kit's blocks
(`SignIn`, `SecurityPage`, `AccountMenu` and the rest). Those blocks import `@stackra/ui/react`, so the built
`react.mjs` loads `@stackra/ui/react` and through it HeroUI, React Aria, Recharts, Motion, Lucide and React Hook Form. A
lean app such as the starter console installs none of them, so it cannot import `useSession` at all: Vite and Vitest
fail to resolve the bundle. The starter console's vertical slice (STA-2827) needs the session without the kit.

### Sources

- `packages/security/identity/src/react/index.ts` (the `./react` stand-in barrel)
- `packages/security/identity/src/react/session/use-session.ts`, `src/react/session-gate/session-gate.tsx` (no UI import)
- `packages/design-system/ui/src/react/rich-text-editor/index.ts` (the same split for TipTap, STA-1895)
- `packages/design-system/icons/package.json` (`./react/lucide-icons`, a sub-entry of `./react`)

## Impact

- **Apps touched**: none (the starter console adopts it in stackra-template, STA-2827)
- **Services touched**: none
- **Packages touched**: packages/security/identity (one stand-in barrel, `exports`, the tsdown entry, a test)
- **Public contract change**: additive; a new entry `@stackra/identity/react/session` exporting `useSession`,
  `SessionGate`, `SessionValue`, `SignedInSession` and `SessionGateProps`. `./react` keeps every name it had.
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none; the same hook and gate, the gate still hides content only
- **Secrets**: none
- **ADR needed**: no (ADR 0294 decision 15 allows a stand-in barrel per entry; STA-1895 set the precedent)
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/security/identity/AGENTS.md` (the entries list)
- **Lane**: full
- **Change risk**: R1 (an additive entry; no existing import changes)

## Acceptance criteria

- **AC-001**: THE package SHALL export `useSession` and `SessionGate` (values) and `SessionValue`, `SignedInSession`
  and `SessionGateProps` (types) from `@stackra/identity/react/session`, and no other value.
- **AC-002**: NOTHING that `@stackra/identity/react/session` loads at run time SHALL import `@stackra/ui` or a UI
  library (`@heroui/react`, `react-aria*`, `recharts`, `motion`, `lucide-react`, `react-hook-form`, `@tiptap/*`).
- **AC-003**: `@stackra/identity/react` SHALL keep exporting every name it exported before.

## Status history

- 2026-11-26 → Clarified (the issue names the entry split as one of two options; the additive entry breaks no import)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Tasked (tasks.md)
- 2026-11-26 → Implementing (built in this branch)
