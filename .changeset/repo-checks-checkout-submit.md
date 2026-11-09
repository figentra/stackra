---
"@stackra/repo-checks": patch
---

`checkouts.checkout_page.submit@1` is a reviewed anonymous surface. Figentra Pay's hosted page sends the payer's
details and terms acceptance with the session's HMAC client token, checked as `load` checks it. A per-session bucket
(10 a minute) bounds the calls, and a row lock binds the session once. The details reach payments in the call and are
never stored; the acceptance's IP address and user agent come from the call, never from input.
