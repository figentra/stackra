# Plan: registry browser

**Spec**: `.agents/specs/sta-1608-registry-browser/spec.md`

## Design

- `parsePath` gains `browsePackage` for `/package/@scope/name`; `/` stays the `landing` kind and now renders the list.
- `src/browse/`: `browsePage` (shell, styles, the inline script, CSP), `escapeHtml`, `renderMarkdown` (escapes all
  input; headings, lists, tables, code, links to http(s) only), `handleBrowseList` (pages through
  `RegistryStore.catalogue`, groups by `stackra.category`), `handleBrowsePackage` (`readAccess` decides full,
  metadata-only or 404), `provenanceOf` (the SLSA statement of the stored bundle), `readmeOf` (README of the latest
  tarball through `readTarball`, which now keeps a top-level README).
- Cache: the list and open pages are public for `openPackumentMaxAge`; gated pages are `private, no-store` with
  `vary: authorization`.

## Constitution Check

| Law                       | Result | Note                                               |
| ------------------------- | ------ | -------------------------------------------------- |
| Boundaries (ADR 0003)     | PASS   | the Worker imports nothing new                     |
| Tenancy                   | PASS   | no tenant data                                     |
| Secrets                   | PASS   | tokens only through `LicenceCheck`; never rendered |
| Not built yet (ADR 0227)  | PASS   | no client framework, no new dependency             |
| Test placement (ADR 0022) | PASS   | `workers/registry/src/**/__tests__/`               |
| Versions and catalogs     | PASS   | no catalog change                                  |
