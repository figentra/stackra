---
"@stackra/integrations": minor
---

<!--
Stackra file contract:
Purpose: release note of stackra-46 (STA-1123): the EDI envelope, acknowledgements, mailbox connector and recorded-case runner.
Boundary: changeset only.
Runtime: none
Governing contract: ADR 0447 (decision 4); ADR 0443 (decisions 7 and 8); stackra-46 re-scope (R2-7, M6).
-->

Add the EDI machinery behind `EdiConnector`, certification pending: `readInterchange` and `writeInterchange` (ASC X12
ISA/GS/ST and UN/EDIFACT UNA/UNB/UNH envelopes with trailer checks), `functionalAcknowledgement` (997 and CONTRL),
`MailboxEdiConnector` over the new `EdiMailbox` transport port (`./contracts`, with `EdiSyntax` and the interchange
types), `MemoryEdiMailbox`, `EDI_MESSAGE_CODES` and `MalformedEdiError`; `./testing` adds `runEdiCase` and `EdiCase`
for OS EDI connectors' recordings. Transport and network vendor connectors stay in OS integrations.
