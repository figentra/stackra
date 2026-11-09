---
"@stackra/gen": minor
"@stackra/loyalty-kit": patch
"@stackra/access-log": patch
---

The seed entry (`.stackra/entry/seed.ts`) registers the service's factory pairs with `registerModelPartners`, so a
demo seeder that uses a factory runs under `stackra db seed`. It also runs the seeders of the packages a service hosts,
imported from each package's `./testing` entry, before the service's own, and lists every seeder in module-dependency
order instead of file order (STA-2061).

`stackra.manifest.json` gains two optional sections, `seeders` (key, module, profile, class, file, in module order) and
`factories` (class, file, model), which a host reads from its dependencies. The committed manifests of
`@stackra/loyalty-kit` and `@stackra/access-log` now carry them.
