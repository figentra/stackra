---
"@stackra/repo-checks": patch
---

`checkouts.checkout_page.choose_method@1` is a reviewed anonymous surface: it binds the payer's method choice to an
unguessable session id with a per-session rate limit, answers only the bound provider session's widget, and returns
no data beyond that session.
