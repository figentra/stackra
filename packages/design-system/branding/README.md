<!--
Stackra file contract:
Purpose: the README of @stackra/branding: what the package does, how a host and a surface use it, its entries and its
         known limits.
Boundary: documentation only; the rules for agents are in AGENTS.md.
Runtime: none (Markdown)
Governing contract: ADR 0294, ADR 0305; ADR 0222; ADR 0307; STA-2644.
-->

# @stackra/branding

A tenant's brand as one thing every surface reads at run time: documents, email, checkout and payment links,
storefronts. The profile is a settings group at platform and tenant scope (so the console's generated settings page
edits it), its images live in a media bucket, and one `BrandReader` answers every surface with the fallbacks resolved
(STA-2644).

**Tier:** `tier:lib` (`packages/design-system/branding`). Entries `.`, `./contracts`, `./node`, and the lang files under
`./assets/*`.

## Use

```ts
// a surface (an invoice renderer, an email layout): inject the reader by type
import { BrandReader } from "@stackra/branding/node";

const brand = await this.brand.profile(Locale.Ar);
brand.displayName; // the Arabic name, else the English one, else null: the caller falls back to the legal name
brand.logo?.variants.print.url; // 600 px wide; `email` is 400 px wide, `mark` 512 × 512
brand.mark; // the square mark, or the logo when no mark is set
brand.primary; // { color: "#1D4ED8", onColor: "#FFFFFF" } or null
brand.accent; // the accent and its on-colour, or null

// uploading a logo: media's signed upload into the brand bucket, then a claim by server code
const pending = await media.createUpload(BrandAssetsBucket, { mediaType: MediaType.Png, size });
const file = await media.claim(upload, BrandAssetsBucket); // file.id is what `branding.logo` stores
```

## The profile

| Setting                                          | Holds                                          | Rule                                                           |
| ------------------------------------------------ | ---------------------------------------------- | -------------------------------------------------------------- |
| `branding.displayName.en`, `.ar`                 | the business name per base locale              | at most 80 characters                                          |
| `branding.logo`, `branding.mark`                 | the upload id of a file in `BrandAssetsBucket` | an `upl_…` id                                                  |
| `branding.primaryColor`                          | `#RRGGBB`                                      | white or `#111111` text on it reaches 4.5:1 (WCAG 1.4.3)       |
| `branding.accentColor`                           | `#RRGGBB`                                      | 3:1 or more against white (WCAG 1.4.11)                        |

Every field defaults to `null`. A level's value wins over the level above it field by field: a tenant that sets only
its primary colour inherits every other field from the platform scope. Put a product's own brand (Figentra's) on its
own tenant node, never at platform scope, or every tenant inherits it.

A colour that fails its contrast rule is never an error at read: `BrandReader` treats it as unset, so the next layer
out that holds a readable colour wins (the platform's), else `null`. A save path refuses it with the first of
`brandColorRefusals(values)`: a `BrandColorContrastError` (`brand_color_contrast`) whose details are the measured
`ratio` (floored to two decimals) and the `minimum`; the message is `branding::errors.brand_color_contrast.message`.

`BrandAssetsBucket` is public, takes PNG and JPEG only, at most 512 KiB, with the variants `print` (600 px wide),
`email` (400 px wide) and `mark` (512 × 512). Media checks the bytes at claim, so an SVG or a renamed file is refused.

## Entries

| Entry         | Holds                                                                                                            |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| `.`           | `BrandingSettings`, `BrandDisplayName`, `BrandColorContrastError`, `onColor`, `brandColorRefusals` (the ratio is `contrastRatio` of `@stackra/tokens`) |
| `./contracts` | the types `BrandProfile`, `BrandImage`, `BrandImageVariants`, `BrandColor`                                        |
| `./node`      | `BrandAssetsBucket`, `BrandReader`                                                                               |
| `./assets/*`  | `lang/en/branding.json`, `lang/ar/branding.json`                                                                 |

## Known limits (v1)

- **A low-contrast colour is not refused on save yet; it is ignored at read.** `SettingsReader#write` and
  `SettingsResolver#write` check a value against its key's type only, so the generated settings page can store a
  low-contrast colour. Save-time refusal needs `@stackra/settings` to check a write against the group's registered
  schema before the store is called (queued with CORE-GAPS); the contrast rule then joins that schema. Until then
  `BrandReader` ignores a failing colour (the next readable layer, else `null`), and a save action can throw the first
  of `brandColorRefusals`. A colour that is not `#RRGGBB`, a name over 80 characters or an id that is not an upload's
  reads as unset (the read schema's `.catch`), so `profile` never throws on a stored value.
- **Accent against white only.** The accent is checked at 3:1 against white; a check against a dark surface waits
  until a surface draws the brand on dark ground.
- **No claim step for the settings page.** A logo or mark id must be claimed into `BrandAssetsBucket` (media's
  `claim`) before it is stored; an unclaimed id reads as `null`. No action in this package claims and stores in one
  step yet. Editing rights are the settings framework's derived `branding.settings.update` permission (L2 in the
  manifest format), which this repository's gen does not emit yet.
- **No cache and no change event.** Every `profile` call reads the settings and asks the disk whether each image exists
  (up to two checks per image). `branding.profile.changed.v1` and a per-tenant cache are not built.
- **Paths and variant URLs mirror media internals.** The reader builds a claimed file's path from the bucket key and
  the variant URLs in the media resizer's `w`/`h` form, because media exports neither a lookup by id nor
  `imageVariantUrl`. The bucket registers its key itself until gen writes bucket registration (STA-339).
- **Display name.** Falls back to the other base locale, then `null`; the legal-name fallback is the caller's.
  Regional overlays (`en-US`, `ar-SA`) use their base language's name.
- **Size rules media does not check.** The logo's 200 px minimum width and the mark's square 512 × 512 minimum are in
  the help text only; media checks type, size and bytes, not dimensions.
- **Arabic.** `assets/lang/ar/branding.json` is pending native-speaker review (ADR 0192).

## Tasks

`pnpm turbo run <task> --filter=@stackra/branding`: `build`, `typecheck`, `lint`, `test`, `test:coverage`, `format`,
`format:check`, `clean`.
