# AGENTS — @figentra/service-health

The reference health service. Member at `services/health` (`tier:service`), in the programming model v3 shape: gen writes
the entry, the wiring and the Encore app into `.stackra/`; nobody writes `main.ts`. Read the README for the routes.

## Rules that fail the build

- No Encore file or import, no `main.ts`, no tool config: gen writes them into `.stackra/`.
- Never import another service; use its generated client or its events.
- `/healthz` calls no dependency (it must not fail because one is down). `/readyz` answers a status per check and never a
  check's detail: no host, no error message, no row.
- A readiness check reports a failure as `down`; it never throws. The readiness service also catches a throw and a
  check that outlasts `PROBE_TIMEOUT_MS`, and counts both `down`.
- One declaration per file; each file sits in its kind's group folder under `src/modules/health/`.
- Versions are `catalog:<name>` or `workspace:*` only.

## Tasks

`pnpm turbo run <task> --filter=@figentra/service-health` — `build`, `typecheck`, `lint`, `test`, `test:int`, `format`,
`format:check`, `clean`. `stackra gen` needs `providers.encore.app` in the root `runway.yaml`; until it is there, use
`stackra gen --manifests` and check `git diff --exit-code stackra.manifest.json`.

## PII

| Data | Where | Handling                                                                                                              |
| ---- | ----- | --------------------------------------------------------------------------------------------------------------------- |
| None | n/a   | Stores and receives no personal data. A probe carries no body, and its answer is a status per dependency, never data. |
