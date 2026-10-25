# Plan: `@stackra/iam` wave 6

**Spec**: `.agents/specs/sta-348-iam/spec.md`

## Design

- Four entries through stand-in barrels (STA-339 replaces them): `./contracts` (`PolicySource`, the snapshot, grant,
  rule and audience types, `Capability`), `.` (`src/core/`), `./react` (`usePermission`) and `./testing` (`actors`,
  the testing plugin).
- Kinds: `Permissions` is bare (`registerKind`); `Policy` uses `createKind` with a bare form typed by its model and a
  called form whose options are `WithPartner`-guarded (the actions `Extension` pattern); `Role` is called only.
- `Permission.Lx` getters return a new frozen value each read, so each static is its own object and
  `registerPermissions` maps it to its locked key; `.system()` marks a permission no role grants.
- The decision point reads one `PolicySource` snapshot per actor link (grants, custom roles, segments, denies,
  visibility, version) and the `Clock`. Module roles come from `registerRoles` and beat a snapshot role of the same
  key. Conditions are `@stackra/rules` trees evaluated by `evaluate` with the time as a fact.
- `IamAccessControlDriver extends Driver(AccessControl)`: `require` checks at the call's `scope` (ADR 0327 d6) and
  only for a call without one maps the caller's scope id to its node through `ScopeTree`; `authorize` resolves the record's policy (registered by model, built by the resolver
  `connectPolicies` set), calls the method named after the verb, then checks again with the record's facts.
- `IamGrantedScopesDriver extends Driver(GrantedScopes)` answers the scope package's header step.
- Record visibility in reads (STA-595): `visibleCondition` reads the snapshot once, settles each rule's audience for
  the principal (it depends on the principal, never on the record) and returns `all(any(allows), not(any(denies)))`,
  dropping the `any(allows)` part when `unmatched` is `Allow`. The server-only `./node` entry holds
  `IamVisibilityFilterDriver extends Driver(VisibilityFilter)` (deps: the decision point, `ContextStorage` for the
  call's scope and instant, `Clock`), `registerVisibility` with its internal registry, and `whereOf`, which maps the
  tree onto MikroORM's `$and`/`$or`/`$not` (an empty `$or` is `1 = 0` in MikroORM 7) and each leaf onto its operator
  behind a "column is set" guard; lists use the jsonb key operators (gen stores `string[]` as jsonb), money the
  embedded `minor` and `currency`. A followed relation nests the target's filter as `$or: [{ rel: null }, { rel: f }]`.
- `PermissionSnapshotService` is the client's store; `usePermission` reads it with `useSyncExternalStore`.
- The testing plugin connects the policies and loads "everyone is owner at the root" into a memory source.

## Constitution Check

| Law                                   | Result | Note                                                                                                                   |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/security/iam`; imports only workspace packages below it; no app, service or `encore.dev`       |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                    |
| Security                              | PASS   | fails closed everywhere; refusals carry no reason; deny beats allow; system permissions only for the platform          |
| HTTP and events                       | PASS   | plugs into the fixed pipeline's permission step and `ctx.authorize` (ADR 0138); refusals map through `ForbiddenError`  |
| Tenancy                               | PASS   | no tenant vocabulary (R-59); scopes are the contracts `ScopeRef`; isolation stays in row-level security (ADR 0333 d5)  |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer |
| Not built yet (ADR 0227)              | PASS   | no OpenFGA, SpiceDB, Cedar or external engine; the in-house check of ADR 0208                                          |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                              |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                      |
| Deploy modes (ADR 0076)               | PASS   | one build in SaaS, on-prem and air-gapped; only the bound `PolicySource` driver differs                                |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                     |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the 0331 d11 reading is an open item                                         |

- Boundaries: runtime imports of `@stackra/actions` (`.` types and `./contracts`), `@stackra/container`,
  `@stackra/contracts`, `@stackra/errors`, `@stackra/rules` (`.`) and `@stackra/scope` (`.` and `./contracts`).
- Versions: catalogs and `workspace:*` only.
- Naming: kind bases `PascalCase(kind)`, no `define` prefix (0305 rule 3); drivers `<Name><Port>Driver`.

## Properties

- **P-001**: `package.json` names `@stackra/iam` at `packages/security/iam` and `exports` lists only `.`, `./contracts`, `./node`, `./react` and `./testing` — Validates: FR-001
- **P-002**: `.` exports `Decision`, `Permission`, `Permissions`, `Policy`, `Risk` and `SystemRole`, `./react` exports `usePermission` and `./testing` exports `actors`, each with the shape the template uses — Validates: FR-002
- **P-003**: `kindOf` reads `permissions`, `policy` and `role` for the three kinds; `Role` throws for every empty, non-`Permission` or system grant list — Validates: FR-003
- **P-004**: for every grant at node `g` and call node `c`, the grant applies exactly when `c` is `g` or below it and the grant is unexpired; a deny that covers the key and matches the audience refuses whatever grant applies — Validates: FR-004
- **P-005**: `visibility` returns `Deny` when any matching rule denies, else `Allow` when one allows, else `Abstain`; `canDelegate` holds exactly when the user holds the role unexpired at or above the target node — Validates: FR-005
- **P-006**: `require` refuses `forbidden` exactly when the check fails; `authorize` refuses when the policy answers `Deny` or the check with the record fails, and throws for an unconnected policy or a non-`Decision` answer — Validates: FR-006
- **P-007**: each registration function stores nothing beyond the failing row and throws for a row that does not match its class; `permissionKey` throws for an unregistered static — Validates: FR-007
- **P-008**: `usePermission` re-renders on every `set`, and every `actors` helper returns a frozen actor of its kind — Validates: FR-008
- **P-009**: the `risk` of `ActionRefOptions`, `ActionRef` and `IntentMatch` is `Risk | undefined` — Validates: FR-009
- **P-010**: for every snapshot, capability and model, a record meets `visibleCondition` exactly when `visibility` on that record answers `Allow`, or `Abstain` with `unmatched: Allow`; a platform actor gets `{ all: [] }` — Validates: FR-010
- **P-011**: for every checked condition and row, the row passes `whereOf`'s filter exactly when `evaluate` matches its facts (a null attribute matching `is_not_set` only), and the driver's filter ANDs a followed model's filter under the relation, letting a row without the related row through — Validates: FR-011
- **P-012**: `registerVisibility` stores a row only when it matches the model's `@Visibility` facet, and throws for every other row without storing it — Validates: FR-012

## Deploy modes

| Mode       | Behaviour                                                                                |
| ---------- | ---------------------------------------------------------------------------------------- |
| SaaS       | the same build; the server binds a `PolicySource` driver fed by the IAM service's events |
| On-prem    | the same build; the same driver against the on-prem IAM service                          |
| Air-gapped | as on-prem: snapshots are local, so a check needs no network                             |
