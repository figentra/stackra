# @stackra/flow-preset

Stackra's preset for [Figentra Flow](https://github.com/figentra/flow) (`fflow`, `@figentra-oss/flow`): the
`flow-*` command texts, spec templates, agents, rules, skills, guard tables and surfaces that `fflow sync` renders
into a Stackra repository, and that the gate reads. Flow itself ships only the `neutral` preset; this package is the
`stackra` preset that used to be bundled in Flow (`assets/flow/presets/stackra`), moved here so Flow can be sold to
anyone (STA-2097, ADR 0510 amendment of 2026-11-04).

The package is data: `preset/` and nothing to build.

## Use

```sh
pnpm exec fflow preset add @stackra/flow-preset   # dev dependency + "preset": "@stackra/flow-preset" in flow.config.json
pnpm exec fflow sync                              # render it; .flow/lock.json records its name, version and digest
```

Nothing runs on install (no postinstall). Flow resolves the package from the repository root and reads the folder
named in `package.json` `"flow": { "preset": "./preset" }`. Upgrading is `pnpm up @stackra/flow-preset`, then
`fflow update`, which prints the diff before it adopts the new content.

## Compatibility

`preset/preset.yml` `requires.flow` is `^1.0.0`: `fflow doctor` fails its `preset` row, and `sync` and `update`
refuse to render, on a Flow outside it. `package.json` will carry the same range as
`peerDependencies` `@figentra-oss/flow` once Flow 1.0.0 is on the registry: pnpm installs a workspace member's own
peers, and an unpublished `^1.0.0` would break core's install (STA-2097).

The guard tables (`preset/guard/*.mjs`) import only `node:` built-ins, their own folder, and Flow's public
`@figentra-oss/flow/guard` and `@figentra-oss/flow/guard/neutral` entries.

## Layout

The folder layout is Flow's preset layout (Flow's README, section "Presets"):

| Path                                                        | Holds                                                         |
| ----------------------------------------------------------- | ------------------------------------------------------------- |
| `preset/preset.yml`                                         | id, version, `requires.flow`, the `adr` queue, the profiles   |
| `preset/commands/`                                          | the `flow-*` command texts                                    |
| `preset/templates/`                                         | spec, plan, tasks and README templates                        |
| `preset/agents/`, `preset/rules/`, `preset/skills/`         | Stackra's agents, rules and own skills                        |
| `preset/guard/`                                             | the guard engine's bash, path and prompt-hint tables          |
| `preset/surfaces/`                                          | `lefthook.yml`, `mcp.yaml` and the `AGENTS.md` block          |
| `preset/third-party.yml`, `preset/reference/`               | third-party skills by source, and the fenced Encore reference |
| `preset/quality-words.yml`, `routing.yaml`, `models.yaml`   | the spec gate's vague words, agent routing and models         |

## Change it

Edit the files here, add a changeset, and let each repository adopt the release with `fflow update`. Never edit a
repository's rendered copies (`.agents/`, `.claude/`, `.opencode/`): `.flow/lock.json` pins their bytes.
`preset/` is kept out of core's oxfmt and oxlint, as Flow kept it, because a reformat changes the digest every
repository has locked.
