---
"@stackra/identity": minor
---

`./testing` gains `runVerificationCase(driver, case)` with `VerificationCase` and `VerificationCaseResult`: the
recorded-fixture harness for `Verification` drivers. It checks a driver's answer against the recorded status, reasons
and provider reference and against the port's rules (supported kind, `verification_unavailable` on an outage, snake_case
reasons, none when verified, a valid `checkedAt`, no subject fact echoed back). The KYC and KYB vendor drivers are OS
integrations code (ADR 0443 decision 7) and run their recorded cases through it, marked certification pending until a
sandbox run passes (owner decision D3, stackra-58, STA-1052).
