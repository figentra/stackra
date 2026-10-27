---
"@stackra/identity": minor
---

The BFF session store sends the CSRF header on every credentialed call (STA-1385). New `IdentityConfig.csrfHeader`
(default `x-stackra-csrf`, lower case), which must equal the API's `app.csrf.headerName`, so @stackra/app's
`CsrfGuard` lets a cookie-bearing sign-out through.
