# .flow

This folder belongs to Figentra Flow (`figentra-flow`, ADR 0510). Do not hand-edit what it generates.

- `constitution.md`: the repository's principles; the `flow-*` commands read it.
- `overrides/`: optional. A template (`overrides/<name>.md`) or a command (`overrides/commands/flow-<verb>.md`)
  here wins over the preset.
- `lock.json`: what `figentra-flow sync` rendered; `figentra-flow gate ci` fails when a rendered file is edited by hand.
- `current.json`: the spec folder `figentra-flow gate dir` chose (git-ignored).
