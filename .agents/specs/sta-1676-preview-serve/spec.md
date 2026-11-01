# Feature Specification: runway preview serve, a local edge for a built surface

**Feature Branch**: `figentra/sta-1676-preview-serve`

**Created**: 2026-10-30

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-1676

**Clarifications status**: complete

**Input**: the Testbed design (item 2 of the shared note on spot boxes, console e2e and isolation), relayed by the leader
on 2026-10-30. `stackra testbed run --serve console` builds the product with runway's `buildProduct` and must serve it on
the box. The shell finds its bundle through the edge KV, and only the in-memory dry-run driver exists. Build a file-backed
`LocalEdgeKv` and a local server, with a configurable API base.

## Impact _(mandatory)_

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `@stackra/runway` (`LocalEdgeKvDriver`, `previewServe`, `releaseOf` moved out of
  `publishProduct`, `renderShellPage`), `@stackra/cli` (`stackra preview serve`)
- **Cross-service events**: none
- **Tenancy and data**: none; no tenant data, a platform page with no scope
- **Secrets**: none
- **ADR needed**: no; it serves what ADR 0437 decisions 2 and 3 already define, locally
- **New dependencies**: none (`node:http` and `fetch`)
- **Deploy modes**: none; a local and CI tool
- **Lane**: lite
- **Change risk**: R1 (a loopback-only local server; no production path changes)
- **Licence tier**: free
- **Docs to update**: runway README, cli README

## Answers

- **API base (Testbed Q1):** a runtime value, not a build define. Generated clients call the page's own origin
  (`ClientsConfig.baseUrl` is empty and the console does not override it), and the edge reserves `/api/*` on that origin.
  `preview serve` proxies `/api` (or the prefixes given) to `--api`. Only a bundle built with `VITE_API_URL` set bakes an
  absolute base in.

## Requirements _(mandatory)_

- **FR-001**: `previewServe` shall write the built bundle's `release:` row and its shell line's `shell:` row into a
  `LocalEdgeKvDriver` file, with every asset URL on the local origin, as a publish would.
- **FR-002**: It shall answer as the edge Worker does: the shell page (import map, startup record, modulepreload,
  stylesheets) for a path without an extension, the shell's own files for a path with one, and the bundle and shell
  files under `/assets/`, refusing a path that leaves its folder.
- **FR-003**: It shall proxy the API prefixes (default `/api`) to the given upstream with method, path, headers and body,
  and answer 503 without one; `stackra preview serve` exposes the options and stops on SIGINT or SIGTERM.

## Success Criteria _(mandatory)_

- **SC-001**: Tests cover the rows, the page, the files, path traversal, the proxy, the 503 and the CLI options.
- **SC-002**: `pnpm verify` green on the tester's box.

## Status history

- 2026-10-30 Implementing: built on `figentra/sta-1676-preview-serve`, handed to stackra-f4.
