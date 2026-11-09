---
"@stackra/repo-checks": patch
---

The test-placement check refuses an `.e2e.page.tsx` (a package's end-to-end page) outside a `__tests__/` folder, and accepts one directly in it.
