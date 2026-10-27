---
"@figentra/worker-registry": minor
---

New Worker member `workers/registry` (`stackra-registry`, ADR 0453): the npm-compatible Stackra registry at
`npm.stackra.figentra.com`. Ping, whoami, packuments (full and abbreviated, rendered into KV), version manifests,
tarballs streamed from R2, dist-tags, deprecation, the GitHub OIDC exchange for a 15-minute publish token bound to one
package (trusted publishers are D1 rows matched on names and numeric ids), the publish checks (immutable versions,
size, name and version, `stackra.kind`, the scope licence rule, integrity and shasum, provenance subject and workflow
identity), ECDSA P-256 registry signatures with `/-/npm/v1/keys`, provenance bundles at `/-/npm/v1/attestations`,
`@stackra` open and `@stackra-pro` licence-gated reads through the `LicenceCheck` port (cached per data centre), and
the catalogue API (`/-/stackra/v1/catalogue`, one item, entitlements). Login answers 403, unpublish 405, and no
upstream is ever proxied. The D1 schema is `migrations/0001_registry.sql`; every limit is a Worker var.
