---
"@stackra/gen": minor
"@stackra/app": minor
---

A service's generated server entry now hands `createApp` its `#stackra/boot`
(`createApp(Root, { wiring, boot })`), and the server `createApp` awaits it once the container is ready with
`DATABASE_URL` and a shutdown signal that `close()` aborts after the drain, so the bus, inbox and relay connect at
service start and stop on shutdown. The generated `boot` connects nothing when the signal has already aborted, and
disconnects the bus and inbox at once when it aborts mid-boot.
