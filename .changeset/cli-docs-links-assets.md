---
"@stackra/cli": patch
---

The docs link check treats an HTML file under `assets/` (a brand email template with placeholder links) as a file the
site serves, not a page: a link may point at it, and its own links are not checked.
