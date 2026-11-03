---
"@stackra/cli": patch
---

`stackra duplicate-exports` (part of `stackra validate`) allows three intended copies, each with its reason:
`ApprovalBinding` (the actions contract type and the tenancy model that stores it), `StepUpRequiredError` (the
actions testing stand-in for identity's refusal) and `DatabaseRunner` (the shape the CLI loads at run time and the
database package's runner) (STA-2079).
