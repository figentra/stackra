# Changesets

Changesets versions and publishes **packages** only (ADR 0025). Apps and services are not versioned: they deploy by
commit SHA (`privatePackages: { version: false, tag: false }`). A package publishes to the private registry
npm.figentra.com once it flips `"private": false`; `access: restricted` matches that registry.

- Add one with `pnpm changeset` in the same change as the code it describes.
- Versioning and publishing run in CI (`.github/workflows/release.yml`) on `main`; do not run them locally.
- Never hand-edit a generated `CHANGELOG.md`.
