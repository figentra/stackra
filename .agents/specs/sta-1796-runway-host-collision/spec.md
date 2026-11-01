# Bug Specification: two surfaces never share one host

**Feature Branch**: `figentra/sta-1796-runway-host-collision`

**Created**: 2026-11-01

**Status**: Clarified

**Linear**: STA-1796

**Clarifications status**: complete

**Input**: Leader, urgent for 0.2.2 (2026-11-01). Runway's `platformRows` writes one edge KV row per host
(`host:<hostname>`), so a second surface whose host resolves to the same name silently overwrites the first, and the
edge serves the wrong surface. Path-prefix routing (host plus path, longest prefix in the edge Worker) is a separate,
larger spec and is not built here.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `packages/developer/runway` (`checkHosts`, `HostIssue`, `resolveHost` moved to core,
  `parseRunway` for the root, `platformRows`, their tests)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no (ADR 0437: one KV row per host)
- **New dependencies**: none
- **Deploy modes**: all (runway refuses before anything publishes)
- **Licence tier**: free
- **Docs to update**: runway README
- **Lane**: bug
- **Change risk**: R2 (a root runway with a shared host, valid before, is refused now)

## Requirements

- **FR-001** `checkHosts(root)` returns a `host_collision` `HostIssue` for each environment in which two surfaces' hosts
  (`host` and `hosts[].host`, resolved under the environment's `domains.zone` as `platformRows` resolves them) are the
  same name, naming the host, the environment and both surfaces. One surface listing a host twice is not a collision;
  `ops` is skipped as `platformRows` skips it.
- **FR-002** `parseRunway("root", …)` throws `RunwayInvalidError` with those issues (code in the message), so
  `stackra validate`, `runway plan` and every command that reads the root fail; `platformRows` refuses the same.
- **FR-003** Tests: the check (same name, relative and absolute names meeting under the zone, per-environment zones,
  one surface's own duplicate, `ops`), `parseRunway` and `platformRows` refusing.

## Status history

- 2026-11-01 → Clarified (leader's urgent 0.2.2 item)
