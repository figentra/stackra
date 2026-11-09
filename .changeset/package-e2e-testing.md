---
"@stackra/testing": minor
---

`./e2e` gains `packageE2ePreset` (the Playwright config of a package: Chromium and `ar-SA` Chromium, Firefox and WebKit opt-in, a Vite page server on port 5199) and `packageE2eVite` (that server's Vite config). `vite` is a new optional peer.

Behaviour change: the `test` of `./e2e` now fails a test whose page logged a console error or threw an uncaught error, so existing app e2e specs that render with console errors start failing. Fix the error, or opt a file out with `test.use({ consoleErrors: "allow" })`.
