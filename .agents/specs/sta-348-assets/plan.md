# Plan: `@stackra/assets` wave 3

**Spec**: `.agents/specs/sta-348-assets/spec.md`

## Design

- `AssetKey` is the template-literal type `` `${string}::${string}/${string}` ``; `AssetEntry<K>` is
  `{ key, file, overridable }`; `AssetTree` is module, kind, leaf; `ResolvedAsset<K>` is `{ key, file, url }`.
- `parseAssetKey` (internal) splits and checks a key: kebab-case module and kind, a path that passes `isRelativePath`
  (internal). Kind folders are not a closed list here; gen owns that check.
- `assets<const T extends AssetTree>(tree: T): T` checks each entry against its place in the tree and returns frozen
  copies, the shape `flagRefs` uses in `@stackra/feature-flags`.
- `AssetLibrary extends Service` takes `FileSystem` (from `@stackra/filesystem/contracts`). The published disk path is
  `<module>/<kind>/<path>`; `resolve` refuses a non-public kind and uses `FileSystem.url`; `read` and `text` use
  `FileSystem.read`. Named `AssetLibrary` so it never clashes with the generated `Assets` constant.
- `useAsset(entry)` is `useContainer().get(AssetLibrary).resolve(entry)`, the shape `usePrefs` uses.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                        |
| ------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/data/assets`; workspace imports: `@stackra/container`, `@stackra/contracts`, `@stackra/filesystem` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                                                         |
| Security                              | N/A    | no auth, tenant data or outbound call                                                                                                                                       |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                                                                |
| Tenancy                               | N/A    | no tenant data                                                                                                                                                              |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                                      |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                                            |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                                   |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                                           |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                                             |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                                          |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                                     |

- Boundaries: imports `@stackra/container`, `@stackra/contracts` (member definition) and `@stackra/filesystem`;
  `./react` imports `.`; no app, service or `encore.dev`.
- Versions: catalogs and `workspace:*` only; no new catalog entry.
- Naming: v3.1; files `<name>.<kind>.ts`; the service class takes no suffix, as `FlagReader` and `EventBus` do.
- Secrets: none.
- No parameter properties and no `#private` fields.

## Deploy modes

| Mode       | Behaviour                                                        |
| ---------- | ---------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service |
| On-prem    | identical: the same build, no SaaS-only code path                |
| Air-gapped | identical: needs no network at build or run                      |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.` and `./react` — Validates: FR-001
- **P-002**: `.` exports `assets`, `AssetLibrary` and the types `AssetEntry`, `AssetKey`, `AssetTree` and `ResolvedAsset` — Validates: FR-002
- **P-003**: `useAsset` from `./react` returns an object with a `url` — Validates: FR-003
- **P-004**: `AssetLibrary` derives an asset's published path from its `<module>::<path>` key alone, and reads no override file at runtime — Validates: FR-004
- **P-005**: `AssetLibrary.resolve` returns a URL for an asset in the `public/` kind folder and throws a `TypeError` for any other kind — Validates: FR-005
