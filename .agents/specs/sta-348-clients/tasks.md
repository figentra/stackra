# Tasks: `@stackra/clients` wave 5

**Input**: `.agents/specs/sta-348-clients/`

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-348-clients/` — covers: SC-001 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/application/clients` — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US1] `ClientTransport`, `ClientSession`, `ClientRequest` and `TransportFailure` in `packages/application/clients/src/contracts`; `ClientsOptions`, its shipped schema and `ClientsConfig` in `packages/application/clients/src/core` and `packages/application/clients/src/config` — covers: FR-002, FR-006 — route: package — deps: T002
- [x] T004 [US1] The ref factories and their spellings (`actionRef`, `queryRef`, `eventRef`, `refusalRef`, `remoteShape`, `widgetRef`, `permissionsRef`, `permissionRefs`, `clientModule`, `moduleRef`, `intents`, `ClientAction`, `ClientQuery`, `ClientRefusal`, `remoteAction`, `remoteQuery`, `remoteEvent`, `remoteRefusal`) and their types in `packages/application/clients/src/core` — covers: FR-002, FR-003, FR-011, P-003, P-011 — route: package — deps: T003
- [x] T005 [US1] `clientRequest`, `httpCall`, `decodeRefusal`, `TransportError`, `ServerRefusalError` and `HttpClientTransportDriver` in `packages/application/clients/src/core` — covers: FR-004, FR-006, P-004, P-006 — route: package — deps: T004
- [x] T006 [US3] `ServiceClient` and its member types in `packages/application/clients/src/core` — covers: FR-005, P-005 — route: package — deps: T005
- [x] T007 [US2] `runAction` and `ClientMutationSenderDriver` in `packages/application/clients/src/core` — covers: FR-007, P-007 — route: package — deps: T005
- [x] T008 [US1] `useQuery`, `useInfiniteQuery`, `useQueryClient`, `useAction` and `useIntentRouter` in `packages/application/clients/src/react` — covers: FR-002, FR-008, P-008 — route: package — deps: T007
- [x] T009 [US4] `createPublicClients` and `RetryOn` in `packages/application/clients/src/server`; `forwardedFacts` in `packages/application/clients/src/worker` — covers: FR-002, FR-009, P-009 — route: package — deps: T005
- [x] T010 [US3] `ClientFake`, `fakeClient` and `fakeClientError` in `packages/application/clients/src/testing` — covers: FR-002, FR-010, P-010 — route: package — deps: T006
- [x] T011 Stand-in barrels for the six entries — covers: FR-001, FR-002, P-002 — route: package — deps: T010
- [x] T012 Tests beside every subject and each barrel's test — covers: SC-002, P-002 — route: tests — deps: T011
- [x] T013 Changeset `.changeset/clients-package.md`; `oxfmt`, `oxlint`, `tsc` and `validate-repository.mjs` clean — covers: SC-001, SC-003 — route: package — deps: T012
- [ ] T014 `pnpm install` to drop the stale `events` and `platform` links, then the tests and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T012
- [x] T015 [US5] `ClientRequest.device`, the `DEVICE_ORDER` headers in `httpCall`, and `ClientMutationSenderDriver` sending the `DeviceOrder` — covers: FR-012, P-012 — route: package — deps: T013
- [x] T016 [US5] `queryRef`'s `replica` option and `ClientReplicaSourceDriver` — covers: FR-013, P-013 — route: package — deps: T013
- [x] T017 [US5] `ClientAcknowledgementReaderDriver` — covers: FR-014, P-014 — route: package — deps: T015
- [x] T018 [US5] Tests for the new drivers, the headers and the replica option; the barrel list, README, AGENTS and the changeset — covers: SC-001, SC-002 — route: tests — deps: T016, T017
- [ ] T019 [US5] Run the wave-9 tests, typecheck and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T018
