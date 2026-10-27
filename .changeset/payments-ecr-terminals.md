---
"@stackra/payments": minor
---

Semi-integrated card terminals over a local link (ADR 0377, STA-677, batch stackra-35). `EcrTerminalGateway`
is the till's `TerminalGateway` for an electronic cash register (ECR) protocol: sale with the tip prompt,
pre-authorisation with completion and void, card-present refund, a cancel beside the running sale and the
last-transaction inquiry that reconciles it; every rejected link call is a lost answer. A provider (Geidea, Network
International) is an `EcrProfile` of pack data, not code. New `./contracts` names `EcrOutcome`, `EcrLink`,
`EcrTiming`, `EcrProfile`, `EcrOperation`, `EcrRequestField`, `EcrResponseField`; new `./testing` fake `EcrLinkFake`.
Certification pending: built from public descriptions with recorded-fixture tests.
