---
"@stackra/gen": patch
---

An app's wiring lists only the drivers its runtimes load (STA-2830). A web console that used the generated clients
failed to boot: `ClientSession` had two candidates, the browser session and the service driver from
`@stackra/app/server`, and no config picked one. An app now drops every candidate from a `/server`, `/node` or
`/worker` entry, a `/native` one unless it has an iOS or Android target and a `/desktop` one unless it has the desktop
target, as a service already drops client entries. A port left with one candidate needs no selector, and a port left
with none (`SignInBrowser` on the web) is left out.
