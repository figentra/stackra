# Tasks: `@stackra/payments`

**Input**: `.agents/specs/sta-348-payments/`

- [x] T001 Spec, plan and tasks — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) — covers: FR-001 — route: package
- [x] T003 Enums, container ports, gateway port interfaces and types in `src/contracts/` — covers: FR-002 — route: package
- [x] T004 Refusals, helpers, `MemoryPaymentRecordsDriver`, `ConnectionPaymentGatewaysDriver` — covers: FR-002, FR-005 — route: package
- [x] T005 `PaymentService` with the `unknown` state, pay links, tokens, terminal and tip — covers: FR-003 — route: package
- [x] T006 Providers: Stripe (Connect, disputes, Terminal), Checkout.com, Moyasar, HyperPay, Paymob, Fawry, Tabby, Tamara; `PAYMENT_CONNECTIONS` — covers: FR-004 — route: package
- [x] T007 Fakes in `src/testing/` and the stand-in barrels — covers: FR-001 — route: package
- [x] T008 Tests beside every subject and the barrel tests — covers: SC-001 — route: tests
- [x] T009 Changeset `.changeset/payments-package.md` — covers: SC-002 — route: package
- [ ] T010 `pnpm install` to link the member, then tests, typecheck and build in the testing workflow — covers: SC-003 — route: tests
- [ ] T011 Geidea and Network International terminal drivers on the `CardTerminal` port of `@stackra/peripherals` once it exists — route: package
- [ ] T012 Paymob regional hosts (KSA, UAE, Oman) as their own Integrations, after the owner confirms them — route: package
- [ ] T013 A form-encoded body in the `@stackra/integrations` managed client, then move Stripe and HyperPay off query parameters — route: package
- [ ] T014 Provider webhook signature schemes in `@stackra/webhooks` — route: package
