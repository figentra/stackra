---
"@stackra/oxlint-config": minor
"@stackra/ui": patch
---

Rule-gap B-6 and B-8 (stackra-233): `eqeqeq` (smart), and on `.tsx` `no-param-reassign` with props,
`react/display-name`, `react/only-export-components` and `react/jsx-no-literals` at error; the React text and naming
rules are off in tests, stories and e2e. `jsx-a11y/prefer-tag-over-role` is decided off.

`@stackra/ui`: no behaviour change. Label defaults are new consts instead of reassigned props; the web and native
`Field` parts and the native glass layer moved to their own files so each hot-reloads; the `Field` table and every
export keep their names and shapes.
