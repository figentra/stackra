---
"@stackra/cli": minor
---

`stackra new package|service` names the member from `--scope` (a product key or `@npm-scope`) or the root runway's
`product.key` (`@figentra/<product>-service-<name>`, ADR 0349 decision 2), writes the stackra/template shape (`#src`
and `#assets` imports, the `./assets/*` export, `catalog:stackra` versions in a product repository), and gains
`--over`, which regenerates over an existing member: only missing files are written and authored files get a printed
diff; `CHANGELOG.md`, `runway.yaml` and `src/` are never touched (STA-1210).
