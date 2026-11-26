# Threat model: @stackra/privacy

<!--
Stackra file contract:
Purpose: the threat model of @stackra/privacy: personal-data declarations, the DSAR export behind a signed expiring
         link, the erasure saga (crypto-shred, delete, anonymise), subject salts and legal holds.
Boundary: documentation only; the code wins on any difference. A change that adds an asset, a trust boundary or an
          external call updates this file in the same pull request (constitution SEC10).
Runtime: none
Governing contract: constitution SEC4 and SEC10; ADR 0189 (decisions 1, 2, 4); ADR 0212; ADR 0134; ADR 0494; ADR 0207
                    (amendment of 2026-11-26: the ASVS level); STA-1375; STA-316.
-->

ASVS level: L1 for every chapter; V8 (data protection) is this package's own (ADR 0207, amendment of 2026-11-26).
Reviewed: 2026-11-26 (STA-316).

Modules declare their personal data; this package exports a subject's data and erases it. Its threats are giving one
person's data to someone else, an erasure that misses data or destroys what a hold must keep, and an export that lives
longer than it should.

## Assets

| Asset                                | Where it lives                                                      | Class          |
| ------------------------------------ | ------------------------------------------------------------------- | -------------- |
| DSAR export zips                     | the export disk (`@stackra/filesystem`), random names, signed links | `pii`          |
| Subject salts                        | `privacy.subject_salts` or the host's store                         | `secret`       |
| Declared personal fields             | the declaring modules' tables                                       | `pii`          |
| Legal holds                          | the hold registry (`privacy` tables)                                | `confidential` |
| Erasure receipts and `SubjectErased` | the workflow, the outbox                                            | `internal`     |

## Trust boundaries

1. The host's request flow, which verifies the person, to `ExportSubjectDataAction` and `EraseSubjectAction`.
2. This package to the declaring modules' tables, under the subject's tenant.
3. The signed export link to whoever holds it.
4. `SubjectErased` to listeners in other packages (identity, search, analytics) and other services.

## Threats and controls

| Threat                                                    | Control today                                                                                                                                    | Open work                                              |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| Someone requests another person's data or erasure         | Export is L2 and erase L4, both system-held: only the platform runs them, after the host verifies the person                                     | —                                                      |
| An export link is shared or found later                   | A random file name behind a signed link valid for `exportTtlDays`; a nightly L4 purge deletes expired zips                                       | —                                                      |
| A provider secret lands in an export                      | `personalDataDeclarations` drops every field classified `credential` (ADR 0494)                                                                  | —                                                      |
| Erasure misses copies in queues, search or other services | Held outbox messages are redacted; the search and vector index forget the subject; identity, analytics and other services act on `SubjectErased` | One classification source driving erasure, STA-1421    |
| Erasure destroys data a legal hold must keep              | The saga asks the hold registry first; held rows are kept and counted; the key is shredded only when no held row carries a shredded field        | —                                                      |
| A shredded field is still readable                        | Shredded fields are sealed under a per-subject key; destroying the salt makes them unreadable                                                    | Field encryption for special-category stores, STA-2241 |
| A hold is placed or released to hide or destroy evidence  | Placing a hold is L2; releasing one is L4; both are audited by the pipeline                                                                      | Audit trail required (fail closed), STA-1571           |
