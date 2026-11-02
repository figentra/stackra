---
"@stackra/console": patch
"@stackra/cli": patch
---

`stackra validate` findings in `@stackra/console` (STA-1966):

- `CommandClass` takes `never[]` collaborators, so the `no-explicit-any` disable is gone.
- `AGENTS.md` gains its PII section.
- The `create` template's NodeNext imports keep their `.ts` extension without tripping ADR 0233's rule.
- knip sees the `stackra-console` bin entry (STA-1985).
- `@stackra/cli`'s duplicate-export check allows console's `Spinner`, `STACKRA_THEME`, `findCommand`, `runCommand` and
  `shapeArabic`, each with its reason.
