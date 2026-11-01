# Implementation Plan: `DriverName<Port>` narrows by the port's class, read from a gen-written registry

**Spec**: `.agents/specs/sta-1810-port-key-brand/spec.md` · **Linear**: STA-1810 · **Branch**:
`figentra/sta-1810-port-key-brand-design` (design only; the implementation branches from main)

This Mac runs only oxfmt and oxlint; tests, typecheck and builds run on a box through the testing session (stackra-8a).

| Step | What                                                                                                                                                                       | Gate                       |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| 1    | `@stackra/container`: add `PortRegistry` (empty interface, file contract), export it from the core entry; rewrite `DriverName` and the `DriverRegistry` docblocks          | container tests, typecheck |
| 2    | `DriverName` type tests: brand wins, class identity through `PortRegistry`, unregistered port widens, two identical ports union, a misspelling errors in each case         | container tests            |
| 3    | `emitWiring`: write the `PortRegistry` rows in the existing `declare module "@stackra/container"` block, from `ref(port)`; no other `declare module`                       | gen tests, golden files    |
| 4    | Validation: `port_key_mismatch` for a hand-written `~key` that is not `<member>.<Port>` (reads the class's `~key` member from the source reader)                           | gen tests                  |
| 5    | A conformance fixture: a member whose port is reached through a named-re-export barrel narrows, and typechecks with a package's port of the same name                      | gen fixture, product gate  |
| 6    | The six hyphenated brands corrected by their owners (or listed in the issue while the check is `warn`); `architecture-guardian` and `api-contract-reviewer` (output shape) | pnpm verify                |

## Constitution Check

| Law                                   | Result | Note                                                                                                                |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `packages/foundation/container` and `packages/developer/gen` only; gen writes `@stackra/container` names as strings |
| Secrets (ADR 0173)                    | N/A    | no secret is read or written                                                                                        |
| Security                              | N/A    | a type-level change and generated output; no input crosses a trust boundary                                         |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                        |
| Tenancy                               | N/A    | no tenant data                                                                                                      |
| Delegation                            | PASS   | `compiler-engineer` writes it; `code-reviewer`, then `architecture-guardian` (gen output is a contract)             |
| Not built yet (ADR 0227)              | PASS   | no `reflect-metadata`, no runtime type reading; the key is derived at build time (ADR 0294 decision 26)             |
| Test placement (ADR 0022)             | PASS   | tests in `src/**/__tests__/` beside their subject                                                                   |
| Versions and catalogs                 | PASS   | no dependency added                                                                                                 |
| Deploy modes (ADR 0076)               | PASS   | generated types only, identical in every mode                                                                       |
| Licence tier (ADR 0077)               | PASS   | free packages                                                                                                       |
| Docs and ADRs                         | PASS   | file contracts updated; ADR 0294 decision 26 stands, no new ADR                                                     |

## Deploy modes

| Mode       | Behaviour                                         |
| ---------- | ------------------------------------------------- |
| SaaS       | same generated types; no runtime behaviour change |
| On-prem    | same                                              |
| Air-gapped | same; gen makes no network call                   |

## Correctness properties

- **P-001**: `PortRegistry` is an empty exported interface in `@stackra/container` and imports nothing from a member;
  `DriverRegistry` is unchanged — Validates: FR-001
- **P-002**: for a port with a brand, `DriverName<P>` equals `DriverRegistry[brand]`; for an unbranded port registered
  in `PortRegistry`, it equals that key's names; for an unregistered port it equals every registered name; `"memroy"`
  is an error in each case; two identical unbranded ports give the union — Validates: FR-002
- **P-003**: gen on the loyalty-kit and entitlements fixtures writes one `PortRegistry` row per registered port key,
  sorted, valued by the imported class (alias included), none for a port without an own driver, and a second run
  changes no byte — Validates: FR-003
- **P-004**: a gen output contains no `declare module` whose specifier is a port's `from`, and no `"~key"` text;
  a fixture whose port is exported through a named-re-export barrel has `DriverName<Port>` equal to its own names
  under the type test — Validates: FR-004
- **P-005**: a port whose `~key` is `data-transfer.TabularWriter` in member `data_transfer` is refused with
  `port_key_mismatch` naming the file, the written key and the derived key; a correct brand and an unbranded port pass —
  Validates: FR-005
- **P-006**: no `*.port.ts` in the repository carries a `~key` that is not its derived key (the check run over
  `packages`) — Validates: FR-006
- **P-007**: `X$Check` still omits the driver-name fields on both sides of `Same<>` (the STA-1805 test is unchanged and
  passes) — Validates: FR-007
