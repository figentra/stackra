---
"@stackra/identity": minor
"@stackra/gen": minor
"@stackra/actions": minor
---

Step-up works out of the box (STA-340). `@stackra/identity` ships `IdentityStepUpCheckDriver`, the `identity` driver of
the actions pipeline's `StepUpCheck` (`requireAssurance` with `IdentityConfig.stepUpMaxAgeMinutes`; a call without
assurance is refused). gen binds it by default in every service that declares `@stackra/identity`; a host without
identity binds none and its step-up actions still fail closed. `@stackra/actions/testing` adds
`MemoryStepUpCheckDriver`, picked by `.useDrivers("memory")`: a test passes `assurance` at the declared level to
`run`, and a call without it is refused `step_up_required`.
