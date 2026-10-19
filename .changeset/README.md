# Changesets

Every workspace member is `private: true`; nothing is published to npm. Changesets is used
only to version members and write their `CHANGELOG.md` (`privatePackages.version: true`,
no git tags, `access: restricted`).

- Add one with `pnpm changeset` in the same change as the code it describes.
- Versioning runs in CI (`.github/workflows/release.yml`) on `main`; do not run it locally.
- Never hand-edit a generated `CHANGELOG.md`.
