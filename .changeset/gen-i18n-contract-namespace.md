---
"@stackra/gen": patch
---

A consumed service's lang namespace that its own contract package also ships (`<service package>-contract`, declared) is taken once, from the contract. It no longer fails gen with `i18n_namespace_clash`.

PAY hit this as soon as payments declared `@stackra/i18n`. The namespaces were consent (compliance-privacy), delivery and inbox (notify), and domains, entities and memberships (tenancy): each was read from both the declared contract and the consumed service's own `assets/lang`.

A namespace shipped by two unrelated packages still clashes.
