<!-- Purpose: what .changeset/ holds and how a changeset is added, versioned and published. Boundary: folder documentation only; the release itself is .github/workflows/release.yml. Runtime: docs. Governing contract: ADR 0119, ADR 0453 (decisions 6 and 18). -->

# `.changeset/`

Pending [Changesets](https://github.com/changesets/changesets): one Markdown file per release note. Changesets
versions **packages** only; the release workflow publishes them to the Stackra registry at `npm.stackra.figentra.com`
([ADR 0453](../apps/docs/src/docs/adr/0453-the-stackra-registry-one-npm-compatible-store-on-cloudflare-and-our-own-licence-engine.mdx)),
never to npmjs. Apps and services are not versioned; they deploy by commit SHA
(`privatePackages: { version: false, tag: false }`). A package publishes, with provenance, once it flips
`"private": false`; `@stackra/*` and `@stackra-pro/*` share one version (`fixed`, 0453 decision 18), and
`access: public` makes the `@stackra` scope open to read (the `@stackra-pro` scope is licensed by the registry).

| File          | Holds                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| `config.json` | the Changesets config: `@changesets/changelog-git`, base branch `main`, one fixed version, public access |
| `<name>.md`   | one pending changeset: the packages it bumps (`patch`, `minor`, `major`) and the note                    |

## Rules

- Add one with `pnpm changeset` in the same change as the code it describes; `pnpm changeset:status` lists what is
  pending.
- Versioning and publishing run in CI (`.github/workflows/release.yml`) on `main`, which opens the version pull
  request; the owner merges it ([ADR 0119](../apps/docs/src/docs/adr/0119-merge-policy-and-release-authority.mdx)). Do not
  run them locally.
- Never hand-edit a generated `CHANGELOG.md`; the `guard-paths` hook refuses it.
- `config.json` stays strict JSON: the Changesets CLI cannot read comments.
