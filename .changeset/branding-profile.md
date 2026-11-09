---
"@stackra/branding": minor
---

New package `@stackra/branding`: a tenant's brand profile every surface reads at run time. `BrandingSettings` (platform
and tenant scope) holds the display name per locale, the logo and mark (ids of files in `BrandAssetsBucket`) and the
primary and accent colours, with WCAG contrast rules (4.5:1 for text on the primary, 3:1 for the accent against white)
whose refusal, `BrandColorContrastError`, names the measured ratio and the minimum. `BrandAssetsBucket` takes PNG and
JPEG only, at most 512 KiB, with `print`, `email` and `mark` variants. `BrandReader#profile(locale)` resolves the
profile tenant, then platform, then plain, with each colour's on-colour (STA-2644). A colour that fails its rule is
ignored at read (the next readable layer, else none), so one tenant's bad colour never breaks its documents. Limits:
it is not refused on save until settings checks writes against the group's schema, and the reader has no cache or
change event yet.
