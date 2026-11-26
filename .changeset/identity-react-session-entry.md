---
"@stackra/identity": minor
---

New entry `@stackra/identity/react/session`: `useSession`, `SessionGate` and their types (`SessionValue`,
`SignedInSession`, `SessionGateProps`) without the identity kit's blocks. Nothing it loads imports `@stackra/ui` or a
UI library, so a lean app (the starter console) can read the session without installing HeroUI, React Aria, Recharts,
Motion, Lucide or React Hook Form. `@stackra/identity/react` still exports every name it did (STA-2832).
