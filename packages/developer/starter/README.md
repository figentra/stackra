# @stackra/starter

The starter `stackra create` writes: every tracked file of the
[stackra-template](https://github.com/stackra-inc/stackra-template) at one pinned commit, packed as
`dist/template.tgz`. It is released in the `@stackra/*` fixed version group, so every `@stackra/cli` version has a
starter of the same version on the Stackra registry ([ADR 0515](../../../apps/docs/src/docs/adr/index.mdx), STA-2874).

**Kind:** package (data). **Tier:** `tier:lib` (`packages/developer/starter`). Nobody installs it: `stackra create`
fetches its tarball from the registry at the CLI's own version, checks the registry's SHA-512 integrity and reads the
archive.

## Why an archive inside the package

`pnpm pack` drops `.npmrc` and drops or applies `.gitignore` files. The template needs both (`.npmrc` maps the Stackra
scopes; `.gitignore` belongs to the new app), so the template travels as one archive the CLI unpacks byte for byte.

## The template pin

`package.json` `stackra.template` names the repository and a full commit id, never a branch, so one starter version
always holds the same files. The build fetches only that commit.

| Task                     | Command                                                                     |
| ------------------------ | --------------------------------------------------------------------------- |
| Build `dist/template.tgz` | `pnpm --filter @stackra/starter build`                                      |
| Move the pin to `main`   | `pnpm --filter @stackra/starter template:bump`                              |
| Pin a given commit       | `pnpm --filter @stackra/starter template:bump -- --commit <40-character id>` |
| List the archive         | `node packages/developer/starter/scripts/build-starter.mjs --list`              |
| Test                     | `pnpm --filter @stackra/starter test`                                       |

A pin move is a change like any other: open a pull request with a changeset. The release's consumer smoke
(`tools/scripts/consumer-smoke.mjs`) runs `stackra create` from the registry before `latest` moves, so a pin that
breaks a new app keeps `latest` where it was.

The build refuses a symlink, a submodule, a commit without `stackra.starter.yaml` and a file `git archive` leaves out
(an `export-ignore` attribute): `stackra create` writes regular files only, and every tracked file must arrive.

## Structure

```text
scripts/build-starter.mjs                    the build and the pin move
scripts/__tests__/build-starter.test.mjs     every tracked file arrives; same commit, same bytes; the refusals
dist/template.tgz                        the archive (built, published, never committed)
```
