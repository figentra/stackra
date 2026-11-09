# Feature Specification: a tenant branding profile every surface reads

**Feature Branch**: `figentra/media-content-sniffing` (the first of three)

**Created**: 2026-11-09

**Status**: Approved (LEADER, 2026-11-09); building

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-2644

**Linear project**: none

**Clarifications status**: complete

**Input**: Owner decision 2026-11-09, through the LEADER (INVOICING lane, STA-2607): branding is one configurable thing
per tenant, edited in the console and read at run time by every surface: invoices and receipts, email, checkout and
payment links, storefronts. The platform tenant's values come from the Figentra brand kit. Invoice-only print settings
(time zone, footer, thank-you line) stay in Invoicing (figentra/invoicing#53).

## Where it belongs

A new package, **`@stackra/branding`** (`packages/design-system/branding`). Nothing existing owns tenant runtime branding:

- `@stackra/brand-kit` generates our own apps' assets at build time from `assets/brand/kit.json`. It never runs per
  tenant.
- `@stackra/theming` is a person's light, dark or system choice over deploy-time token themes.
- `@stackra/settings` stores and edits values per scope, but a logo is a file, and the profile needs one reader that
  resolves fallbacks for every surface.
- `@stackra/media` stores files in Buckets, but it knows nothing of brands.

`@stackra/branding` composes the last two: the profile is a Settings class at Tenant scope (so the console's generated
settings page edits it), its images live in a media Bucket, and one `BrandReader` answers every surface.

## Impact

- **Packages touched**:
  - `@stackra/branding`: new;
  - `@stackra/media`: content sniffing for a Bucket's accepted types;
  - `@stackra/documents`: a brand slot and accent colour in print templates (this absorbs the accent gap queued with
    CORE-GAPS).
- **Services touched**: none in core. Each consumer is its own lane's PR (below).
- **Apps touched**: none in core. The console edits it through the settings page gen already writes.
- **Cross-service events**: one, `branding.profile.changed.v1` (tenant id only), so caches and published storefronts
  refresh.

## The profile

| Field          | Type                                            | Rule                                                                                   |
| -------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------- |
| `displayName`  | text per locale (`en`, `ar`, regional overlays) | ≤ 80 characters; falls back to the tenant's legal name                                 |
| `logo`         | media ref in `BrandAssetsBucket`                | PNG or JPEG only, content-sniffed, ≤ 512 KiB, ≥ 200 px wide                            |
| `mark`         | media ref, optional                             | square PNG or JPEG, 512 × 512 px minimum; falls back to the logo                       |
| `primaryColor` | `#RRGGBB`                                       | a text colour on it (white or near-black) must reach 4.5:1 (WCAG AA), or it is refused |
| `accentColor`  | `#RRGGBB`                                       | 3:1 against white and against the dark surface (WCAG 1.4.11, non-text); refused below  |

No SVG, ever: an SVG can carry script or fetch resources inside the headless Chromium that prints PDFs and inside mail
clients. Unset fields fall back tenant → platform defaults → plain (black on white, no logo).

## User Scenarios

1. **A merchant brands once** (P1). A tenant admin uploads a logo, picks two colours and names the business in the
   console's settings page. Their next invoice, receipt email, payment link and storefront show it, with no other
   step.
2. **An unsafe file is refused** (P1). An SVG, a renamed file whose bytes are not PNG or JPEG, or an image over the cap
   is refused at upload with a message that says which rule it broke. Nothing is stored.
3. **An unreadable colour is refused** (P1). A primary or accent colour that fails its contrast rule is refused on save,
   with the measured ratio and the minimum.
4. **Figentra's own documents carry Figentra's brand** (P1). The platform tenant's profile holds the Figentra brand kit's
   logo, mark and colours, so Billing's fee invoices and Figentra's emails are branded like any merchant's.
5. **The legal zone stays locked** (P1). On a tax document the brand adds a logo slot above the title and an accent on
   the title and rules. It never moves, hides or restyles a mandatory field, the Arabic, the QR or the totals.

## Requirements

- **FR-001** `@stackra/branding` declares `BrandingSettings extends Settings({ scopes: [Platform, Tenant] })` with the
  fields above. `logo` and `mark` are media refs. The colours carry the contrast rules, and a refusal names the ratio.
- **FR-002** It declares `BrandAssetsBucket`: accepted `image/png` and `image/jpeg`, a 512 KiB cap, and the variants
  `print` (≤ 600 px wide), `email` (≤ 400 px wide) and `mark` (512 × 512). Uploads go through media's signed uploads.
- **FR-003** `@stackra/media` checks every upload's bytes against the Bucket's accepted types (PNG `89 50 4E 47 0D 0A
1A 0A`, JPEG `FF D8 FF`, and each other type's signature it accepts) and refuses a mismatch with
  `MediaTypeMismatchError`, whatever the declared type.
- **FR-004** `BrandReader#profile()` returns the resolved `BrandProfile` of the running call's tenant (display name for a
  locale, the logo and mark as `ImageAsset` per variant, colours with their computed on-colours). It is cached per
  tenant and forgotten on `branding.profile.changed.v1`.
- **FR-005** `@stackra/documents` print templates accept an optional `brand` (logo slot and accent). The renderer places
  the logo above the first block and colours the title and rules. A template's other blocks are untouched, and a test
  proves a branded render keeps every block's text and order.
- **FR-006** The platform tenant's values are seeded from the Figentra brand kit by Figentra OS (core names no product
  brand).
- **FR-007** The PDF engine prints with Chromium's network fetches and JavaScript off, as an engine-image setting the
  deployment ships with (see Risks).

## Success Criteria

- **SC-001** One upload and two colours in the console change the logo and colours on an invoice PDF, a receipt email,
  a payment link and a storefront, each verified by its consumer's test.
- **SC-002** An SVG, a mismatched PNG and an oversize JPEG are each refused by media with the rule named, and no file is
  stored.
- **SC-003** A fully branded invoice keeps its legal blocks byte-identical in text and order (the Invoicing test in #53
  extends to logo and accent).

## Consumers: one PR per owning lane, after the package is released

| Lane                    | PR                                                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| CORE (INVOICING writes) | `@stackra/branding`; media content sniffing; documents brand slot and accent                                      |
| OS                      | the platform tenant's profile seeded from `@figentra/brand-figentra`; the console settings page check             |
| INVOICING               | tax documents render with `BrandReader`'s logo and accent; Billing's fee invoices follow from the platform tenant |
| NOTIFY                  | email layouts take the logo, mark and colours                                                                     |
| PAY / CHECKOUT          | checkout and payment-link pages                                                                                   |
| COMMERCE                | storefront theme defaults and receipts                                                                            |

Wallet passes (`@stackra/integrations` pass logos) and SEO cards (`@stackra/seo`) can follow later, in core.

## Decisions (the four defaults, approved 2026-11-09)

1. A logo for dark surfaces (`logoOnDark`)? Default: out of v1. The surfaces put the logo on light ground.
2. Display name per locale or one string? Default: per locale, since Arabic storefronts and documents need the Arabic
   name.
3. Who may edit: a tenant admin only? Default: a `branding.profile.update` permission at L2, granted to tenant admins.
4. Logo cap 512 KiB? Default: yes, with variants generated at upload, so surfaces never ship the original.

## Risks

- **The PDF engine fetches the network today.** `GotenbergPdfEngineDriver` sends the HTML with paper size and margins
  only, and Chromium's network and JavaScript limits are Gotenberg's server flags (`--chromium-deny-list`,
  `--chromium-allow-list`, `--chromium-disable-javascript`), which no deployment sets yet. Images arrive as `data:` URLs
  and `renderHtml` escapes every text, so nothing should fetch, but the engine should refuse to.

## Build order

1. `@stackra/media` content sniffing (this branch).
2. `@stackra/branding`.
3. The `@stackra/documents` brand slot and accent.

The consumer PRs follow the release.

## Out of scope (named, not built)

Several print layouts per tenant (after launch), custom fonts, per-surface overrides, Arabic-Indic digits per column
(queued with CORE-GAPS), and brand guidelines or approval workflows.
