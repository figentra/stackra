---
"@stackra/gen": patch
"@stackra/cli": patch
"@stackra/runway": patch
"@stackra/database": patch
---

A service's generated Encore services move out of the `.stackra` dot folder, so Encore finds them: it skips dot
folders when it discovers services, and an Encore build of `.stackra/encore/<svc>/` had no services at all.

- `stackra gen` writes them into `stackra-encore/<svc>/` at the member root, beside `encore.app`; `@stackra/gen`
  exports the folder name as `ENCORE_SERVICES_DIR`. The runtime entry and gen output stay in `.stackra/`, and the
  generated files import them from there.
- `stackra dev` runs `encore run` in the member root.
- Runway's Encore Cloud deploy tree carries `stackra-encore/` and reads `encore.app` from the member root.

Add `stackra-encore/` to your repository's `.gitignore`, then regenerate (`stackra gen`). The old
`.stackra/encore/` can be deleted; Encore never discovers it.
