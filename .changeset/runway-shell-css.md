---
"@stackra/runway": patch
---

The shell release row now carries the shell's own stylesheets (STA-1681): `shellReleaseOf` adds `css` from
`dist/shell.json` as URLs on the asset store, so the edge Worker's page (and the local edge's) links them before the
bundle's.
