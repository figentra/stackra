---
"@stackra/gen": patch
---

A Connection that extends another Connection (`class RegionalConnection extends BaseConnection`) is now paired with
the member's Integration of the same stem (`RegionalIntegration`), or inherits its base's integration when there is
none. Its Integration gets its `connection` in the manifest and `registerConnections` registers the pair; before, the
subclass had no partner and was skipped. Two same-stem Integrations in one member are `connection_partner_ambiguous`.
An Integration's connection is the one named after it, so a subclass that only inherits never displaces it.
