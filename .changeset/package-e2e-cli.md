---
"@stackra/cli": minor
---

`stackra test --tier e2e` runs in a package too: it uses the `.stackra/playwright.e2e.config.ts` gen writes for a package that has a `.e2e.page.tsx`, and refuses with a hint when there is none. A service or a worker still refuses.
