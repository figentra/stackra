---
"@stackra/cli": minor
---

`stackra check` has a `hooks` phase after `lint`: it compiles each `.tsx` file in a component home (class components
become the function components gen emits) and runs oxlint's `react/rules-of-hooks` on the result, reporting each
finding at the source file and line. The repository lint has that rule off in those homes, so this closes the gap.
