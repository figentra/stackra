---
"@stackra/gen": patch
---

A dependency whose port the member injects from its `./contracts` entry stays fully hosted, so the port's drivers are
wired. Before, a service that injected `FileSystem` from `@stackra/filesystem/contracts` and imported nothing else of
the package was hosted contracts-only and failed at boot with `No driver is bound to FileSystem`. Only a dependency
imported for its events and types goes contracts-only. The same holds for a port named in a `DriverName<Port>` config
field: `DriverName<LogReporter>` from `@stackra/logger/contracts` lists `console` and `otlp` again instead of an empty
enum.
