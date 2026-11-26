---
"@stackra/cli": patch
---

`stackra doctor` and `stackra dev` now see a dev port held by a listener bound only to a loopback address (127.0.0.1
or ::1, as Vite's dev server binds). The port check bound only the wildcard address, which macOS allows beside such a
listener, so the port was reported free; it now also binds 127.0.0.1 and ::1 (skipping an address the machine lacks).
