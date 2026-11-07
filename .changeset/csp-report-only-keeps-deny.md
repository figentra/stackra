---
"@stackra/csp": patch
---

While `reportOnly` is on, `securityHeaders` keeps `X-Frame-Options: DENY` on every path, framed ones included:
browsers never enforce `frame-ancestors` from a report-only header, so dropping it left a framed path open to every
site during a rollout. `frameAncestorOrigin` is now exported, so a host can refuse a stored framer (a merchant's embed
origin) at write time with the same rule the header uses.
