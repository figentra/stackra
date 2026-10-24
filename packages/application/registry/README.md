# @stackra/registry

Stackra module catalogue validation: the checks a registry service runs on the `stackra.manifest.json` files CI
publishes (ADR 0109), before it accepts them into its catalogue. Every result is a list of diagnostics in a fixed order,
so the same manifests always give the same output.

**Tier:** `tier:lib` (`packages/application/registry`). One entry, `.`. Depends on `@stackra/contracts`,
`@stackra/validation` and zod. Pure functions, no I/O.

## What is here

| Symbol                    | Use                                                                                            |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| `validateCatalogue`       | checks a set of manifests as one catalogue; returns `CatalogueDiagnostic[]`, empty when valid  |
| `CatalogueManifest`       | the shape of one published manifest: header plus `modules`, `actions`, `events`, `permissions` |
| `CatalogueDiagnosticCode` | the seven codes below                                                                          |
| `CatalogueDiagnostic`     | type: `{ code, member, path, message }`                                                        |

## Use

```ts
import { CatalogueManifest, validateCatalogue } from "@stackra/registry";
import { validate } from "@stackra/validation";

const diagnostics = validateCatalogue([...storedManifests, incoming]);
if (diagnostics.length > 0) return refuse(diagnostics);

const manifest = validate(CatalogueManifest, incoming); // typed, now known to pass
```

## Checks

| Code                 | Reported when                                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `manifest_invalid`   | the manifest breaks its shape (one per issue); it is not checked further                                         |
| `duplicate_member`   | another manifest already has this member key; the later one is not checked further                               |
| `identity_collision` | a module key, action key, event name or permission key is declared twice                                         |
| `unknown_module`     | an action or event names a module its own member does not declare                                                |
| `foreign_namespace`  | an action key or event name does not start with `<its module>.`, or a permission key with a module of its member |
| `unknown_dependency` | a module depends on a module no manifest declares                                                                |
| `dependency_cycle`   | modules reach each other through `dependsOn` (one per group, on its smallest key)                                |

## Order

Manifests are walked sorted by member key and package name, so the first owner of an identity is the same whatever
order they arrive in, and the later declaration carries the diagnostic. The diagnostics are sorted by member, path,
code and message, compared by code unit, never by locale. `path` points into that member's manifest, as
`modules[0].dependsOn[1]`; it is `""` for the manifest itself.

## Not here

The registry client, the merged catalogue a consumer keeps, the per-tenant install resolver and the manifest version
diff belong to the registry service (ADR 0214, ADR 0157).
