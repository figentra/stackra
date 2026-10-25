# @stackra/achievements

Stackra achievements: award kinds kept as scope data, awards granted by hand or automatically when a kind's
`@stackra/rules` criteria match a recipient's facts, revoke, an opaque verify token resolved across scopes with a QR
code, and the fields of a certificate that `@stackra/documents` renders (ADR 0368, OS ADR 0058). The package names no
recipient model and no award kind: kinds, levels and certificate layouts are data a product seeds and a tenant edits.

**Tier:** `tier:lib` (`packages/application/achievements`). Entries `./contracts`, `.` and `./node`. Depends on
`@stackra/actions`, `@stackra/contracts`, `@stackra/database`, `@stackra/errors`, `@stackra/events`, `@stackra/model`,
`@stackra/rules`, `@stackra/validation`, `uqr` and zod.

## What is here

| Symbol                                    | Entry         | Use                                                                                   |
| ----------------------------------------- | ------------- | ------------------------------------------------------------------------------------- |
| `GrantRefusal`                            | `./contracts` | the seven reasons a grant is refused (`kind_archived` … `period_taken`)               |
| `RecipientRef`                            | `./contracts` | `{ model, id }`, the record an award is granted to                                    |
| `AwardRecipient`                          | `./contracts` | `{ model, rules }`, what a consumer registers per recipient model                     |
| `VerifiedAward`, `CertificateFields`      | `./contracts` | what `verify` and `certificateOf` return                                              |
| `AwardGranted`, `AwardRevoked`            | `.`           | integration events (`achievements.award.granted.v1`, `achievements.award.revoked.v1`) |
| `AwardNotGrantableError`                  | `.`           | `award_not_grantable` (412) with its `GrantRefusal`                                   |
| `AwardRevokedError`                       | `.`           | `award_revoked` (412): a certificate or a second revoke of a revoked award            |
| `checkGrant`                              | `.`           | the grant check, isomorphic so a form previews it                                     |
| `verifyQr`                                | `.`           | a verify URL as an SVG QR code                                                        |
| `registerAwardRecipients`                 | `./node`      | `[{ model: "workforce.member", rules: MEMBER_AWARD_RULES }]`                          |
| `AwardKindService`                        | `./node`      | `create`, `archive`, `draftCriteria`, `publishCriteria`                               |
| `AwardService`                            | `./node`      | `grant`, `consider`, `revoke`, `awardsOf`, `verify`, `certificateOf`                  |
| `AwardKind`, `Award`, `AwardVerification` | `./node`      | the models: `achievements.award_kinds`, `achievements.awards`, `.award_verifications` |

## Kinds and grants

```ts
registerAwardRecipients([{ model: "workforce.member", rules: MEMBER_AWARD_RULES }]);

const kind = await kinds.create(scope, {
  key: "belt_grading",
  name: "Belt grading",
  recipient: "workforce.member",
  levels: ["white", "yellow", "orange"], // lowest first
  isAscending: true,
  certificateTemplate: "academy::print/belt-certificate",
});
await awards.grant(scope, { kindId: kind.id, recipient, level: "yellow" }, ctx.actor.id);
```

`checkGrant` refuses an archived kind, another recipient model, a missing or unknown level, a level not above the
recipient's highest live level on an ascending kind, and a missing or taken period on a once-per-period kind. A period
is a key the caller chooses (`2026-09`).

## Criteria

```ts
const revision = await kinds.draftCriteria(kind.id, input.condition); // a kind without levels
await kinds.publishCriteria(kind.id, revision);
await awards.consider(scope, { model: "workforce.member", id }, facts, { period: "2026-09" });
```

`consider` evaluates every active kind over the model with a published revision, at the clock's time, and grants each
match the recipient may hold: once, or once per period (skipped with no period). The consumer computes the facts and
calls it from its own listener; the package never reads a recipient's data.

## Verify and certificates

```ts
const verified = await awards.verify(params.token); // null: unknown, malformed or revoked
const fields = await awards.certificateOf(award.id, settings.verifyBaseUrl);
// fields.template, fields.verifyUrl, fields.verifyQr (SVG) → @stackra/documents
await awards.revoke(award.id, input.reason); // AwardRevoked; the token stops resolving
```

The token (32 random bytes, base64url) stays on the award under row-level security. `achievements.award_verifications`
holds only its SHA-256, the award id and the scope, with no row-level security (ADR 0368 decision 5); `verify` reads it
and opens the award's scope session, so call it from its own public action.

## Tables and scope

`achievements.award_kinds` and `achievements.awards` carry `scope_id` and `scope_path` under forced row-level security
(migration `achievements.0001_create_achievements`, with `ltree`). Kinds are unique per scope and key.

## Not here

- Points (`@stackra/loyalty-kit`), leaderboards (report widgets), goals, Open Badges and wallet passes.
- Whether an AI principal may grant: a platform floor the calling action checks (ADR 0368 open questions).
- A unique index per kind, recipient and period: two concurrent grants for one period can both pass.
- A short typeable verification code.
