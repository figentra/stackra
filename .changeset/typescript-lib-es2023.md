---
"@stackra/typescript-config": minor
---

Every preset's `lib` is ES2023 (Expo keeps ESNext), so `toSorted`, `toReversed`, `toSpliced`, `with` and `findLast` typecheck
in services and libraries without `@types/node`; `target` stays ES2022.
