---
"@stackra/flow-preset": patch
---

The reviewer agents post an advisory `Review (advisory): PASS|FAIL <sha>` comment through `pnpm bot:gh` instead of
`pnpm bot:review`: the stackra-reviewer App is retired (ADR 0523 decision 6), and nothing counts the comment.
