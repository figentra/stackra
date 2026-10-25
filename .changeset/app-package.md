---
"@stackra/app": minor
---

Add `@stackra/app`, the app runtime of the programming model v3.1: `createApp` for each runtime target, returning that
target's object (ADR 0295 decision 8). `./server` gives `ServerApp` (`key`, `ready()`, `drain()`, `close()`,
`handlers`, with signal handling and exit codes) and the `Controller` kind for raw HTTP; `./worker` gives `WorkerApp`
(`fetch`, the crash page on any throw) and `WorkerRequest<E>`; `./browser` gives `BrowserApp` (`hydrate({ nonce })`,
`mount(root)`, `router`) and `hydrateRoute` for one prerendered page; `./native` gives `NativeApp` (`Root`, booting
behind the splash); `./electron` gives `DesktopApp` (`start()`, `windows`) with the hardening baseline and the bridge
channel. `.` holds the shared `bootApp` and the `AppWiring` token; `./react` holds `Contexts`, mounted in graph order,
and `registerContext`.
