---
"@stackra/gen": patch
---

A service a member depends on (for its contract) ships its lang catalogues as that service's, so a namespace both share moves under the service's name (`I18n.payments.plans`) instead of refusing with `i18n_namespace_clash`; the member keeps the bare namespace.
