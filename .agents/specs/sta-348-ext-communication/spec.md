# Feature Specification: extend notifications, integrations, i18n, validation and support (package needs, 2026-10-25)

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Clarifications status**: complete (conflicts settled by their recommended option)

**Input**: the rows of `@stackra/notifications`, `@stackra/integrations`, `@stackra/i18n`, `@stackra/validation` and
`@stackra/support` in `notes/handover/stackra-package-needs.md`, plus the Chatwoot integration, the voice channel
(telephony category), the geocoding and address-autocomplete port, and conflicts #1 (GTIN check digits in validation)
and #2 (one-time codes in validation).

## Impact

- **Packages touched**: `packages/communication/notifications`, `packages/communication/integrations`,
  `packages/foundation/i18n`, `packages/foundation/validation`, `packages/foundation/support`
- **Services touched**: none (the notifications, messaging and integrations services bind the new ports)
- **New dependencies**: none outside the workspace. New workspace edges: integrations on `@stackra/money` and
  `@stackra/validation` (types); notifications on `@stackra/integrations` and `@stackra/errors`; i18n on
  `@stackra/support`
- **Secrets**: names only — `CHATWOOT_HOST`, `CHATWOOT_PLATFORM_TOKEN`, `CHATWOOT_ACCOUNT_TOKEN`, `RESEND_API_KEY`,
  `RESEND_TENANT_API_KEY`, `SES_SECRET_ACCESS_KEY`, `UNIFONIC_APP_SID`, `TAQNYAT_API_TOKEN`, `TAQNYAT_TENANT_API_TOKEN`,
  `CEQUENS_API_TOKEN`, `CEQUENS_TENANT_API_TOKEN`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_TENANT_AUTH_TOKEN`,
  `META_WHATSAPP_ACCESS_TOKEN`, `META_WHATSAPP_TENANT_ACCESS_TOKEN`, `EXPO_ACCESS_TOKEN`, `WEB_PUSH_VAPID_PUBLIC_KEY`,
  `WEB_PUSH_VAPID_PRIVATE_KEY`, `WEB_PUSH_VAPID_SUBJECT`
- **Configuration, not code**: no Market, country format, provider choice, quiet window, mandatory category, channel
  order, escalation step, OTP policy or address layout is written in code; each is passed in from market-pack data,
  settings or rule sets
- **Change risk**: R2 (new public contracts; existing exports kept)

## Decisions

- Conflict #1: GTIN, EAN and UPC check digits in `@stackra/validation`; GS1 restricted-range allocation and Code 128 in
  `@stackra/support` (support keeps a private copy of the mod-10 digit because it has no dependency).
- Conflict #2: one-time codes in `@stackra/validation` (issue and verify; peppered HMAC, expiry, attempts, constant time).
- ADR 0356: one `ProviderResolver` in integrations for every multi-provider capability; the Market's providers are
  `ProviderDefaults` data and the Market is `MarketContext`'s answer.
- ADR 0355: one provider, one Integration. Twilio is one Integration in notifications serving SMS and voice; the voice
  port (`VoiceGateway`) is in `@stackra/integrations/contracts` (telephony category).
- Identifier formats (national IDs, VAT and TRN, IBAN, postal codes, phones) are pack data (`IdentifierFormat`); code
  holds the check algorithms only.
- Speech in Arabic dialects is the voice provider's (`listen` and `say` steps with a data-chosen language tag and voice);
  no separate speech port is added.

## Requirements

- **FR-001** support: `Quantity` (exact units), `restrictedGtin`, `code128`.
- **FR-002** validation: `IdentifierFormat`/`IdentifierCheck`/`checkIdentifier`/`identifier`, `e164`, `countryCode`,
  `address`, GTIN functions, one-time codes.
- **FR-003** i18n: locales `ar-AE`, `ar-EG`, `fr`, `de`; `normalizeArabic`; `withDigits`; `formatAddress`, `countryName`;
  `formatLength`/`LengthUnit`; `./contracts` with `TranslationProvider`, `Geocoder`, `AddressAutocomplete`.
- **FR-004** integrations: roles and connector kinds, fuller listing, `booking`/`telephony`/`wallet` categories,
  per-region base URLs and form bodies, `ProviderResolver`, `credentialRef`, accounting journals, connector interfaces,
  telephony port and `recordingPlan`, `Pass` kind, Chatwoot.
- **FR-005** notifications: Resend, SES, Unifonic, Taqnyat, Twilio (SMS and voice), Cequens, WhatsApp Cloud API, Expo
  and Web Push drivers; `WhatsAppTransport`, `PushTransport`, `PushTokenStore`, `SendLog`, `TemplateOverrides`;
  `resolveTemplate`, `sendAfter`, `dueEscalations`; fakes.

## Success Criteria

- **SC-001**: spec, plan, tasks and one changeset per package exist.
- **SC-002**: every new public symbol has a test in `src/**/__tests__/` (owner mode: tests are written, not run here).

## Open items (for the owner)

- Apple Wallet pass signing needs a CMS (PKCS #7) signer: a new dependency (for example `pkijs`) or a host signer port.
- Google Wallet needs the service-account JWT-bearer grant, which is not one of the managed client's six auth types.
- Ad-platform (Meta, TikTok, Snap, Google) and marketplace (Amazon, noon, Salla, Zid) Integrations are not built: each
  needs the product scope of COM-301 and verified API access. The WhatsApp Cloud API is `meta-whatsapp` here; ADR 0355
  decision 5 wants one Meta Integration, so the ads one must join it.
- No accounting provider driver (Xero, QuickBooks, Zoho Books, Odoo) and no geocoding or translation driver ships yet.
- Provider endpoints were written from public documentation and are not exercised against sandboxes (Cequens' balance
  path and Chatwoot's contact payload above all).
- ADR 0356 open question 1 (which Market keys SMS and WhatsApp) is left to the host's `MarketContext` binding.
- Chatwoot inbound webhooks carry no signature scheme this package declares; the messaging service must authenticate
  them another way (a secret path) until one is agreed.

## Status history

- 2026-10-25 · — → Implementing · Claude (package-builder) · owner mode (develop now, test later)
