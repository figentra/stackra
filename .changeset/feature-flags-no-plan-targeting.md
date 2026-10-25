---
"@stackra/feature-flags": minor
---

Add the `./lint` entry: the `feature-flags` oxlint plugin with the `no-plan-targeting` rule, which refuses a flag named
after a plan, tier, edition, entitlement or subscription, or a `Flag({...})` option keyed by one (flags are not
entitlements, ADR 0213 decision 7).
