# @stackra/branding

## 0.33.1

### Patch Changes

- Updated dependencies [bf2c6ea]
- Updated dependencies [e885a38]
  - @stackra/contracts@0.33.1
  - @stackra/tenancy@0.33.1
  - @stackra/settings@0.33.1
  - @stackra/filesystem@0.33.1
  - @stackra/media@0.33.1
  - @stackra/container@0.33.1
  - @stackra/errors@0.33.1
  - @stackra/i18n@0.33.1
  - @stackra/validation@0.33.1
  - @stackra/tokens@0.33.1

## 0.33.0

### Patch Changes

- Updated dependencies [4937622]
- Updated dependencies [93d63bb]
- Updated dependencies [628b60d]
- Updated dependencies [03da426]
- Updated dependencies [93d63bb]
  - @stackra/i18n@0.33.0
  - @stackra/contracts@0.33.0
  - @stackra/settings@0.33.0
  - @stackra/tenancy@0.33.0
  - @stackra/media@0.33.0
  - @stackra/filesystem@0.33.0
  - @stackra/tokens@0.33.0
  - @stackra/errors@0.33.0
  - @stackra/container@0.33.0
  - @stackra/validation@0.33.0

## 0.32.0

### Patch Changes

- @stackra/filesystem@0.32.0
  - @stackra/media@0.32.0
  - @stackra/tokens@0.32.0
  - @stackra/errors@0.32.0
  - @stackra/i18n@0.32.0
  - @stackra/tenancy@0.32.0
  - @stackra/settings@0.32.0
  - @stackra/container@0.32.0
  - @stackra/contracts@0.32.0
  - @stackra/validation@0.32.0

## 0.31.0

### Patch Changes

- Updated dependencies [0f05f60]
  - @stackra/i18n@0.31.0
  - @stackra/settings@0.31.0
  - @stackra/media@0.31.0
  - @stackra/tenancy@0.31.0
  - @stackra/filesystem@0.31.0
  - @stackra/tokens@0.31.0
  - @stackra/container@0.31.0
  - @stackra/contracts@0.31.0
  - @stackra/errors@0.31.0
  - @stackra/validation@0.31.0

## 0.30.0

### Minor Changes

- 678b5c5: `BrandReader#bytes(image)` reads a resolved brand image's original bytes from the media disk, so a surface that embeds
  it (a printed document's logo) never fetches its URL. It returns `null` when the file has gone (STA-2644).
- 7323fec: New package `@stackra/branding`: a tenant's brand profile every surface reads at run time. `BrandingSettings` (platform
  and tenant scope) holds the display name per locale, the logo and mark (ids of files in `BrandAssetsBucket`) and the
  primary and accent colours, with WCAG contrast rules (4.5:1 for text on the primary, 3:1 for the accent against white)
  whose refusal, `BrandColorContrastError`, names the measured ratio and the minimum. `BrandAssetsBucket` takes PNG and
  JPEG only, at most 512 KiB, with `print`, `email` and `mark` variants. `BrandReader#profile(locale)` resolves the
  profile tenant, then platform, then plain, with each colour's on-colour (STA-2644). A colour that fails its rule is
  ignored at read (the next readable layer, else none), so one tenant's bad colour never breaks its documents. Limits:
  it is not refused on save until settings checks writes against the group's schema, and the reader has no cache or
  change event yet.

### Patch Changes

- Updated dependencies [17fafdd]
- Updated dependencies [4ce80a2]
- Updated dependencies [0394e56]
- Updated dependencies [8084b3a]
- Updated dependencies [8c17109]
- Updated dependencies [8c17109]
- Updated dependencies [bed3456]
- Updated dependencies [d5ffcdd]
- Updated dependencies [f6a087c]
- Updated dependencies [ef49e63]
- Updated dependencies [a03990d]
- Updated dependencies [c8e7592]
- Updated dependencies [11def65]
- Updated dependencies [d5a7d0a]
- Updated dependencies [d3c8b27]
  - @stackra/contracts@0.30.0
  - @stackra/errors@0.30.0
  - @stackra/filesystem@0.30.0
  - @stackra/settings@0.30.0
  - @stackra/media@0.30.0
  - @stackra/container@0.30.0
  - @stackra/tenancy@0.30.0
  - @stackra/tokens@0.30.0
  - @stackra/i18n@0.30.0
  - @stackra/validation@0.30.0

Written by Changesets on release; never edited by hand.
