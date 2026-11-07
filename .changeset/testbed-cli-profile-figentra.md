---
"@stackra/cli": patch
---

`stackra testbed` defaults to the `figentra` AWS profile, which replaces the old `academorix` profile name for the same
account. The key file keeps its live name; `STACKRA_TESTBED_AWS_PROFILE` still overrides the profile.
