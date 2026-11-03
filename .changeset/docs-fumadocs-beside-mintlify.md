---
"@stackra/gen": minor
"@stackra/cli": minor
---

A docs app that depends on `fumadocs-ui` gets its Fumadocs site from `stackra gen` in `.stackra/fumadocs/`, beside the Mintlify root in `.stackra/site/`. Both are built from the same pages, and a refusal from either stops the run. The Mintlify root and its `llms.txt` do not change. For a docs member, `stackra dev|build|lint --target fumadocs` serves, prerenders and link-checks the Fumadocs site, and `stackra test --tier e2e` runs Playwright from the member root. At the cutover (STA-2026) the Fumadocs site moves into `.stackra/site/` and Mintlify goes.
