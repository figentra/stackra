# Plan: `@stackra/navigation` wave 7

**Spec**: `.agents/specs/sta-348-navigation/spec.md`

## Design

- `Route`, `Layout` and `Menu` are `createKind` bases. `Route` is called only and records its options with defaults;
  its instance declares `loader`, `submit` and `meta` (authors write `override`) and a type-only `~options` member that
  `RouteContext<this>`, `RouteProps` and `InferParams` read. `Layout` is bare or called. `Menu`'s `items(m)` is not on
  the base.
- `routeRef(key)` is a frozen `{ name }`; `registerRoutes(table)` maps keys to classes; `resolveHref` turns a ref, a
  settings page, a path holder or a string into an href, prefixed by the mount through `@stackra/seo`'s `localePath`.
- `createRouteContext(input)` is the one context builder: params and query against the route's shapes, the mount's
  locale, `query`/`action` through a `RouteCaller`, lazy container members, answers (`data`, `fieldErrors`,
  `notFound`, `redirect`, `redirectToCanonical`, `navigate`), then the layout's data, contributed parts and members.
- `./react`: the data-route builders run loaders and actions through `answerRoute` (a layout's loader once per request
  via `LAYOUT_RUNS`, keys read from `toRoot`); `routeAdapter` and `routeContext` serve framework-mode route modules,
  the head resolved inside the loader by `resolveSeo`; links and hooks resolve hrefs with `useHrefResolver`; the root
  boundary renders `@stackra/ui` states without a container; `useNavigation` gates by flag and iam's snapshot.
- `./native`: `toScreen` and `useLayoutLoader` run loaders with `nativeLoad`; `useNavigate` over React Navigation;
  `ContextMenu` binds a menu to a value on the ui kit's `Menu`, actions through nested `useAction` runners.
- `./testing`: `runLoader` merges registered testing parts, builds the context and returns `{ result, ...fakes }`.

## Constitution Check

| Law                                   | Result | Note                                                                                                                       |
| ------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/experience/navigation`; workspace imports are packages only; no app, service or `encore.dev`       |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged; `ctx.env` is the member's typed env, set by its adapter                               |
| Security                              | PASS   | the form body drops prototype segments and oversized indexes; params are validated; open redirects stay the app's to check |
| HTTP and events                       | N/A    | no action, endpoint or event is declared; routes call consumed clients only                                                |
| Tenancy                               | N/A    | no tenant data                                                                                                             |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer     |
| Not built yet (ADR 0227)              | PASS   | React Router 7 on web and code-based React Navigation on mobile; no expo-router                                            |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                  |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                          |
| Deploy modes (ADR 0076)               | PASS   | a library, identical in SaaS, on-prem and air-gapped                                                                       |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                         |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                    |

## Deploy modes

| Mode       | Behaviour                                              |
| ---------- | ------------------------------------------------------ |
| SaaS       | a library, bundled into the consumer's app or Worker   |
| On-prem    | identical: the same build, no SaaS-only code path      |
| Air-gapped | identical: needs no network of its own at build or run |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.`, `./contracts`, `./react`, `./native` and `./testing` — Validates: FR-001
- **P-002**: every template import resolves to a symbol of the shape it uses, except the open items; the barrel tests list each entry's values exactly — Validates: FR-002
- **P-003**: the adapters wrap `react-router` and `@react-navigation/native` only, the boundary renders `@stackra/ui` states, hrefs follow `localePath`, and `.` imports no React, router or React Native module — Validates: FR-003
- **P-004**: `RouteServices` and `RouteLoaderRun` accept declaration merging, their values come from `contributeRouteContext` and `registerRouteTestingPart`, and no file imports identity, tenancy or state code — Validates: FR-004
- **P-005**: `readFormData` drops `__proto__`, `constructor` and `prototype` segments and list indexes above 999, a params-shape failure throws a 404 `RouteResponse`, and a query-shape failure keeps the valid entries — Validates: FR-005
- **P-006**: for any route class and input, `runRouteLoader` and `runRouteSubmit` answer what the class's `loader` or `submit` returns for the context `createRouteContext` builds from the input and the parts' members, with those members on the result; `renderRoute` renders the page with that loader's data at the route's path; `routeMeta` returns `seoDescriptors(routeSeo(...))`; and no `./testing` file imports identity, tenancy or settings — Validates: FR-006
- **P-007**: a crumb published under a `BreadcrumbsProvider` appears in `useBreadcrumbs` ordered by href depth, one per href, and leaves with its publisher; `toResource` routes exactly the page names of panel's `resource()` (`list`, `view`, `create`, `edit`) the resource carries — Validates: FR-007
