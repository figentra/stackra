---
"@stackra/oxlint-config": minor
---

`react/rules-of-hooks` is off for `.tsx` files in the component homes (`components/`, `blocks/`, `routes/`, a package's
`react/` and `native/`, `*.mail.tsx`), so a class component's hook fields pass as ADR 0305 rules 37, 38 and 41 allow;
hook files (`use-*`), every `.ts` file and tests keep the rule.
