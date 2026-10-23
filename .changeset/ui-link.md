---
"@stackra/ui": minor
---

Add `Link` to `./react` (HeroUI v3 `Link`) and `./native` (HeroUI Native `LinkButton`), with `LinkUnderline` and
`LinkContractProps` in `./contracts`. A link takes `href`, `onPress`, `isDisabled`, `isExternal`, `tone`, `underline`
(`always` by default, so a link in running text is not told apart by colour alone), `label` and `externalLabel`.
`Link` imports no router: `./react` re-exports React Aria's `RouterProvider` for client navigation, and `./native` ships
its own `RouterProvider` (`navigate(href)`) that `@stackra/navigation` binds to React Navigation; without one a native
app path opens in the system browser.
