---
"@stackra/actions": minor
"@stackra/gen": minor
---

`Action` and `Query` take an `entitlement` option (one entitlement class or a list), and gen now gates calls by it
(STA-2059, ADR 0215). The manifest lists a call in the `gates` of every entitlement it names, of a quota whose meter it
feeds (`meter`, `per` on the quota entry; `meter` and `entitlements` on the action entry) and of a limit counting a
model it creates, including an entitlement or model a hosted package ships. A name that resolves to nothing fails the
build with `entitlement_unknown` or `entitlement_counts_unknown`.
