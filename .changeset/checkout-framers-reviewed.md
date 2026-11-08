---
"@stackra/repo-checks": patch
---

`checkouts.checkout_page.framers@1`, the edge's frame-ancestors callback for Figentra Pay's checkout (STA-2564), is a
reviewed anonymous surface: it answers only the checkout's configured public embed origins and fails closed.
