# Threat model: @stackra/access-log

<!--
Stackra file contract:
Purpose: the threat model of @stackra/access-log: the access records and the write audit, their per-tenant hash
         chains, the retention purge and the NDJSON export to a SIEM.
Boundary: documentation only; the code wins on any difference. A change that adds an asset, a trust boundary or an
          external call updates this file in the same pull request (constitution SEC10).
Runtime: none
Governing contract: constitution SEC3, SEC4 and SEC10; ADR 0212; ADR 0465 (decision 4); ADR 0207 (amendment of
                    2026-11-26: the ASVS level); STA-316.
-->

ASVS level: L1 for every chapter; V7 (error handling and logging) is this package's own (ADR 0207, amendment of 2026-11-26).
Reviewed: 2026-11-26 (STA-316).

The package writes who read whose data (`@AccessLogged`) and every audited action call (`PostgresAuditTrailDriver`),
each in a SHA-256 hash chain per tenant, purges access records after their retention, and pushes the write audit to a
SIEM as NDJSON. It is evidence: its threats are losing, altering or leaking that evidence.

## Assets

| Asset                                 | Where it lives                                          | Class          |
| ------------------------------------- | ------------------------------------------------------- | -------------- |
| Access records (actor, subjects, key) | `access_log.access_log_entries`, one chain per tenant   | `pii`          |
| Write audit entries                   | `access_log.audit_log_entries`, one chain per tenant    | `confidential` |
| Chain links (sequence, hashes)        | both tables (`sequence`, `previous_hash`, `hash`)       | `internal`     |
| Export token                          | `ACCESS_LOG_EXPORT_TOKEN`, read blind through `@Secret` | `secret`       |
| Exported NDJSON batches               | in flight to the SIEM collector at `exportUrl`          | `confidential` |

## Trust boundaries

1. The action pipeline to this package: the actor, scope and audit fields come from the verified call.
2. This package to Postgres: tenant-owned tables under row-level security, written inside `withTenant`.
3. This package to the SIEM collector: HTTPS POST with a bearer token.
4. A tenant admin reading or exporting the audit through `AuditQuery` and `ExportAuditAction`.

## Threats and controls

| Threat                                                     | Control today                                                                                                                    | Open work                                                       |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| An operator or attacker edits or deletes a record          | A trigger refuses every `UPDATE` and migration 0003 revokes `UPDATE`; any edit, removal or reorder breaks `findChainBreak`       | KMS-signed daily checkpoints and Object Lock storage (ADR 0212) |
| A forked chain from two writers racing to the head         | Unique `(tenant_id, sequence)`; a writer that loses the race rereads the head and retries, up to five times                      | —                                                               |
| One tenant reads another tenant's audit                    | Both tables are tenant-owned with RLS `ENABLE` + `FORCE`; `AuditQuery` never takes a tenant from input                           | —                                                               |
| A write goes unaudited because no `AuditTrail` is bound    | None in this package: the pipeline skips the audit step when the port is unbound                                                 | Audit trail required outside dev and test, STA-1571             |
| A sensitive read is served when its access record fails    | `failClosed` refuses the read for financial, health and regulated classes and for `@AccessLogged({ failClosed: true })` surfaces | —                                                               |
| Personal data copied into the audit                        | Records carry public ids and declared `ctx.audit` fields only; the event payload of identity events is never stored              | One classification source checked on audit fields, STA-1421     |
| The export token or the audit leaks in transit or in a log | HTTPS only; the token is a `@Secret`, never logged; the export needs the L2 permission `access_log.audit_log_entry.export`       | —                                                               |
| Evidence kept past its purpose, or purged too early        | `retentionDays` (400 by default, at least 90) purges access records nightly; the purge is an L4 system permission                | Enforce `auditRetentionDays` on the write audit (ADR 0212)      |
