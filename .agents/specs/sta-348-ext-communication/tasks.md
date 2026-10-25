# Tasks: extend notifications, integrations, i18n, validation and support

**Input**: `.agents/specs/sta-348-ext-communication/`

- [x] T001 Spec, plan and tasks — covers: SC-001
- [x] T002 support: `Quantity`, `restrictedGtin`, `code128`, barrel, README, AGENTS — covers: FR-001
- [x] T003 validation: identifiers, `e164`, `countryCode`, `address`, GTIN, one-time codes — covers: FR-002
- [x] T004 i18n: locales, `normalizeArabic`, `withDigits`, `formatAddress`, `countryName`, `formatLength`, `./contracts`
      ports — covers: FR-003
- [x] T005 integrations: roles, connector kinds, listing, categories, base URL placeholders, form bodies,
      `ProviderResolver`, `credentialRef`, journals, connectors, telephony, `Pass`, Chatwoot — covers: FR-004
- [x] T006 notifications: providers, drivers, ports, template cascade, quiet hours, escalation, fakes — covers: FR-005
- [x] T007 Tests for every new public symbol in `src/**/__tests__/` — covers: SC-002
- [x] T008 One changeset per package — covers: SC-001
- [ ] T009 Run the packages' tests, typecheck and build in the separate testing workflow — covers: SC-002
- [ ] T010 Open items of the spec (wallet drivers, ad and marketplace Integrations, accounting, geocoding and translation
      drivers) — owner decisions first
