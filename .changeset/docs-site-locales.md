---
"@stackra/gen": minor
---

Docs sites in more than one language. `DocsConfig.locales` lists the languages, with one default:

- **Pages.** A page in another language sits beside its default page as `<page>.<code>.mdx` and is served under
  `/<code>/`. A page that isn't translated yet links to the default page in that language's navigation.
- **Direction.** The page sets `lang` and `dir`, so an Arabic page renders right to left, sidebar included.
- **Interface.** Each language gets its own interface strings, navigation labels and font. Arabic ships with its
  strings and IBM Plex Sans Arabic.
- **Language switch.** The switch keeps the reader on the same page.
- **Checks.** gen refuses a translation that has no default page and a page that sits in a language's folder. A page
  not yet translated is only a warning.
- **No change by default.** With `locales` left empty (the default), a site is written byte for byte as before.
