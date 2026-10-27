# `.changeset/`

Pending [Changesets](https://github.com/changesets/changesets): one Markdown file per release note. Changesets
versions and publishes **packages** only ([ADR 0025](../apps/docs/src/docs/adr/0025-packages-publish-to-private-registry.mdx)).
Apps and services are not versioned; they deploy by commit SHA (`privatePackages: { version: false, tag: false }`).
A package publishes to public npmjs, with provenance, once it flips `"private": false`; `access: public` matches.

| File          | Holds                                                                                 |
| ------------- | ------------------------------------------------------------------------------------- |
| `config.json` | the Changesets config: `@changesets/changelog-git`, base branch `main`, public access |
| `<name>.md`   | one pending changeset: the packages it bumps (`patch`, `minor`, `major`) and the note |

## Rules

- Add one with `pnpm changeset` in the same change as the code it describes; `pnpm changeset:status` lists what is
  pending.
- Versioning and publishing run in CI (`.github/workflows/release.yml`) on `main`, which opens the version pull
  request; the owner merges it ([ADR 0119](../apps/docs/src/docs/adr/0119-merge-policy-and-release-authority.mdx)). Do not
  run them locally.
- Never hand-edit a generated `CHANGELOG.md`; the `guard-paths` hook refuses it.
- `config.json` stays strict JSON: the Changesets CLI cannot read comments.
