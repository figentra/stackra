---
"@stackra/runway": minor
"@stackra/repo-checks": patch
---

`runMobileJob` reads mobile `whiteLabel.entitlement`: a scope-started white-label build is refused unless the
variant's new `entitlements` list holds it. The field leaves `RUNWAY_UNREAD_FIELDS` and its schema description no longer
says "Not read yet".
