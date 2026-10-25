# Tasks: extend money, pricing, loyalty-kit, peripherals, devices and platform

**Input**: `.agents/specs/sta-348-ext-commerce-devices/`

- [x] T001 Spec, plan and tasks — covers: SC-001 — route: spec-draft
- [x] T002 money: rates, cash rounding, unit prices, decimal strings — covers: FR-001 — route: package — deps: T001
- [x] T003 pricing: price evaluation, formula, channel, tax port and table — covers: FR-002 — route: package — deps: T002
- [x] T004 platform: kiosk mode, second screen, `card_terminal` capability — covers: FR-005 — route: package — deps: T001
- [x] T005 peripherals: label printer, customer display, card terminal, scale barcodes — covers: FR-003 — route: package — deps: T004
- [x] T006 devices: registry and pairing ports, stored identity and credential drivers — covers: FR-004 — route: package — deps: T001
- [x] T007 loyalty-kit: stamp cards — covers: FR-006 — route: package — deps: T001
- [x] T008 Tests beside every subject and updated barrel tests — covers: SC-002, FR-008 — route: tests — deps: T002-T007
- [x] T009 One changeset per package — covers: SC-001 — route: package — deps: T008
- [ ] T010 `LoyaltyMembers` driver on OS parties — blocked: the parties service has no API defined (OS build-readiness)
- [ ] T011 US sales-tax provider driver — OS integrations connector behind `TaxProvider`; vendor not chosen
- [ ] T012 Run the packages' tests, typecheck and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T008
