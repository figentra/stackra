---
"@stackra/gen": patch
---

An app's generated `#stackra/i18n` catalogue loaders load in the browser again. gen wrote each loader with
`{ with: { type: "json" } }`, and Vite serves the JSON as a JavaScript module, so the browser refused every catalogue
("Expected a JSON module script"). An app's loaders now import the JSON plainly and let its bundler (Vite, Metro) load
it; services, packages and Workers keep the attribute, which Node and esbuild need. Regenerate (`stackra gen`).
