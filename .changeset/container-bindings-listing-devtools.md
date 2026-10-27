---
"@stackra/container": minor
---

Add `Container.bindings()`, a read-only listing of what the container can build, by name, for tooling: token, scope
(the binding module key, or a port's driver config key), lifetime and the class built. It never returns or builds an
instance. Add the dev-only `./devtools` entry: `defineContainerDevtools(kit, container)` defines the
`container.bindings` devtools tab, and `DevtoolsTabSink` is the kit's `defineTab` by shape, which every package's
devtools entry takes so none depends on `@stackra/devtools-kit` (stackra-208, ADR 0246, ADR 0461).
