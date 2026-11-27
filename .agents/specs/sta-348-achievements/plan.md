# Plan: `@stackra/achievements`

**Spec**: `.agents/specs/sta-348-achievements/spec.md` · **ADR**: 0368

## Design

- Entries through stand-in barrels: `./contracts` (`GrantRefusal`, `RecipientRef`, `AwardRecipient`, `VerifiedAward`,
  `CertificateFields`), `.` (`AwardGranted`, `AwardRevoked`, `AwardNotGrantableError`, `AwardRevokedError`,
  `checkGrant`, `verifyQr`), `./node` (models, services, `registerAwardRecipients`). No `./testing`: nothing to connect.
- Models `AwardKind` (`awk`), `Award` (`awd`), `AwardVerification` (`awv`); `CreateAchievementsMigration`.
- `AwardKindService(RuleSetService)`: `create`, `archive`, `draftCriteria` (opens the rule set on first draft),
  `publishCriteria`.
- `AwardService(AwardKindService, RuleSetService, Database, Clock)`: `grant`, `consider`, `revoke`, `awardsOf`,
  `verify` (hash lookup, then `withScope`), `certificateOf`; private `issue` writes award, event and index row.
- `checkGrant` ports the Academorix `checkAwardIssue` behaviour (ORIGIN.md), returning codes not sentences.

## Constitution Check

| Law                       | Result | Note                                                                        |
| ------------------------- | ------ | --------------------------------------------------------------------------- |
| Boundaries (ADR 0003)     | PASS   | `tier:lib`; imports only `tier:lib` packages                                |
| Secrets                   | N/A    | none                                                                        |
| Tenancy                   | PASS   | RLS on kinds and awards; the unscoped index is named by ADR 0368 decision 5 |
| Configuration over code   | PASS   | kinds, levels, periods, URL base and layouts are data or caller input       |
| Versions and catalogs     | PASS   | `catalog:` and `workspace:*`; `uqr` is a new default-catalog entry          |
| Test placement (ADR 0022) | PASS   | `src/**/__tests__/`                                                         |
| Third-party sources       | PASS   | first-party behaviour port; `ORIGIN.md` names repository and commit         |
