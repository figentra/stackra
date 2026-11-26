---
"@stackra/gen": patch
---

Gen refuses `encore_side_effects_dropped` when a member it writes Encore files for (`stackra-encore/<member>/`) declares
`"sideEffects": false` in package.json: that flag lets Encore's bundler drop the generated files' `import "./database"`,
so the service booted with "no database url was provided". The fix it names is to delete the field (STA-2794).
