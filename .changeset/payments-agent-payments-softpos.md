---
"@stackra/payments": minor
---

Add agent payments and the SoftPos family (ADR 0446). Agent payments are the `AgentCommerceProtocols` port with
`AgentConfirmation` and `AgentCheckoutRequest`, `PaymentService.agentCheckout` (it refuses an agent paying alone with
`AgentConfirmationRefusedError`), `agent` on `PaymentRecord` and the memory driver. The SoftPos family is the `SoftPos`
port, the `soft_pos` capability, `softPos` on `TerminalRequest`, `clientSecret` on `TerminalSession`, the
`stripe-tap-to-pay` driver over the app's `StripeTerminalBridge`, the memory SoftPos driver and
`SoftPosUnavailableError`.
