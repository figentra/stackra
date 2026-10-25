---
"@stackra/experience": minor
---

Add document kinds (`ExperienceKind`: page, screen, form, email template, print document, theme section) with a
`kinds` option on `Block` (a page and a screen by default) and `blockKinds`; the server-side `validateDocument`, which
returns every problem of a document against its kind, the blocks and the depth and size bounds without throwing; and
section-based themes with append-only revisions and rollback (`commitTheme`, `rollbackTheme`, `diffTheme`,
`validateTheme`).
