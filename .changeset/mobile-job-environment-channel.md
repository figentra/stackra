---
"@stackra/runway": patch
---

The mobile job builds on the environment's EAS channel: `environments.<env>.mobile.channel` from the root runway
picks the build profile and channel, and the app's `mobile.<app>.eas.channel` is the fallback. A staging deploy built
on the app's production channel before.

`mobile.<app>.eas.slug` names the EAS project's slug when it is not `<project>-<app>`, so an app built under a
project created as `pay` (not `figentra-pay-pay`) passes EAS's slug check.
