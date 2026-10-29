---
"@stackra/repo-checks": minor
---

`checkDocFile` now also requires a TSDoc block on symbols exported through a local `export { … }` list or
`export default name`, on `export default <expr>`, and on each member of an `enum` or const-object enum (`Enum.of({ … })`
or a literal-valued `{ … } as const`; a one-word label is enough there). `isDocScoped` now covers `.mts` and `.cts`
sources.
