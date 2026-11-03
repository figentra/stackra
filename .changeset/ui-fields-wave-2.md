---
"@stackra/ui": minor
---

Five web components in `@stackra/ui/react` from the UI build list (STA-1981). `Autocomplete` wraps HeroUI v3's
Autocomplete with the single ComboBox contract: a select whose list opens with a search box that narrows it.
`ColorField` wraps HeroUI v3's ColorField with ColorPicker's field contract, a typed `#rrggbb` value with a swatch
of it. `ColorSwatch` wraps HeroUI v3's ColorSwatch and also draws a colour React Aria cannot parse, such as a token's
`var()`. `Flag` draws a country's flag from its ISO code (or a language tag's region) with `flagOf`. `MarkerMap`
places pins by projection on an SVG, with no map tiles, beside a selectable `List` of them in a `SidePanel`.
