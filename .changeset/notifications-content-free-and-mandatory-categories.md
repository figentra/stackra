---
"@stackra/notifications": minor
---

Content-free templates and mandatory categories (STA-964, ACA-539): `assertContentFree` refuses a content-free
template that reads anything but the record's kind and link (`CONTENT_FREE_FIELDS`, `ContentFreeData`) with
`RestrictedFieldError`, and `resolveTemplate` runs it; `NotificationsConfig.mandatoryCategories` lists, per pack, the
categories a recipient cannot mute (`canMute`) and quiet hours never hold (`sendAfter`). New lang key
`templates.content_free.record` in all seven locales.
