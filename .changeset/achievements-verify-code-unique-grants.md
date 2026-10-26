---
"@stackra/achievements": minor
---

Add the public `VerifyAwardQuery` (`award.verify`, by token or short code), a 12-character typed code per award with
`normalizeAwardCode` and `AwardService.verifyCode`, a unique index of live awards per kind, recipient and period
(a lost race is `period_taken`), and `AwardService.renderCertificate` through `@stackra/documents` (STA-717, ADR 0432).
