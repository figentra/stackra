---
"@stackra/ui": patch
---

The web `Button` takes `href` and `target`: with an `href` (and not disabled or loading) it renders an accessible
link, React Aria's `Link` with the button's HeroUI classes, the composition `PageActions` already uses, so it
navigates through the nearest `RouterProvider`. HeroUI v3's button has no `as` and dropped `href`, so
`<Button as="a" href>` rendered a button that went nowhere. Without `href` it is unchanged.
