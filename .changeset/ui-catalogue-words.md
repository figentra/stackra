---
"@stackra/ui": minor
---

The default words of the web and native components come from the `ui` catalogue through the nearest `I18nProvider`,
falling back to English without one (STA-788). `useCatalogueText` is exported for packages that ship their own
catalogue.
