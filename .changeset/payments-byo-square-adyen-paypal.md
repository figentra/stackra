---
"@stackra/payments": minor
---

Bring-your-own Square, Adyen and PayPal (STA-687, ACA-542, batch stackra-34). `TerminalGateway.cancelTerminal` takes
the session's `providerRef` as an optional second argument and `PaymentService.cancelTerminal` passes it, so a cloud
terminal API (Square Terminal checkouts, Adyen's Terminal API abort) cancels that session only; the gateway fake voids
only the named session. The README maps each vendor's API to the ports and lists the Integrations, Connections and
webhook recipes left for the OS integrations service (ADR 0443 decisions 7 and 8); `oauth-standard` now documents
Square OAuth beside BYO Stripe. Certification pending.
