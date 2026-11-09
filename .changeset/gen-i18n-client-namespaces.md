---
"@stackra/gen": patch
---

A consumed service's lang namespace that one of the member's own modules also has no longer clashes: it lives under
the service's client name (`geography.rates`, keys `geography.rates::<path>`, loaded from the service's own
`rates.json`), and the member's own namespace keeps its name. A package and the member claiming one namespace is still
refused (`i18n_namespace_clash`).
