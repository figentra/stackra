---
"@stackra/gen": patch
---

A generated docs site titles its home page (`index.mdx`, or a language's `index.<lang>.mdx`) by the page's own
words alone, not followed by the site name it already names ("Figentra Geo · Figentra Geo"). The build now also fails
when a prerendered title repeats a part.
