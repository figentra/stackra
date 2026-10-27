# @stackra/achievements

<!--
Stackra file contract:
Purpose: the reader guide of @stackra/achievements: award kinds, grants and criteria, verify and certificates, the award
         wallet pass, tables and scope, and what is not here.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none (Markdown)
Governing contract: ADR 0368; ADR 0432; ADR 0348 (decision 5: wallet passes); OS ADR 0058.
-->

Stackra achievements: award kinds kept as scope data, awards granted by hand or automatically when a kind's
`@stackra/rules` criteria match a recipient's facts, revoke, an opaque verify token resolved across scopes with a QR
code, and the fields of a certificate that `@stackra/documents` renders (ADR 0368, OS ADR 0058). The package names no
recipient model and no award kind: kinds, levels and certificate layouts are data a product seeds and a tenant edits.

**Tier:** `tier:lib` (`packages/application/achievements`). Entries `./contracts`, `.` and `./node`, and the lang
files under `./assets/*`. Depends on `@stackra/actions`, `@stackra/contracts`, `@stackra/database`,
`@stackra/documents`, `@stackra/errors`, `@stackra/events`, `@stackra/integrations` (the `Pass` kind), `@stackra/model`,
`@stackra/rules`, `@stackra/validation`, `uqr` and zod.

## What is here

| Symbol                                    | Entry         | Use                                                                                                     |
| ----------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------- |
| `GrantRefusal`                            | `./contracts` | the seven reasons a grant is refused (`kind_archived` … `period_taken`)                                 |
| `RecipientRef`                            | `./contracts` | `{ model, id }`, the record an award is granted to                                                      |
| `AwardRecipient`                          | `./contracts` | `{ model, rules }`, what a consumer registers per recipient model                                       |
| `VerifiedAward`, `CertificateFields`      | `./contracts` | what `verify` and `certificateOf` return                                                                |
| `AwardGranted`, `AwardRevoked`            | `.`           | integration events (`achievements.award.granted.v1`, `achievements.award.revoked.v1`)                   |
| `AwardNotGrantableError`                  | `.`           | `award_not_grantable` (412) with its `GrantRefusal`                                                     |
| `AwardRevokedError`                       | `.`           | `award_revoked` (412): a certificate or a second revoke of a revoked award                              |
| `checkGrant`                              | `.`           | the grant check, isomorphic so a form previews it                                                       |
| `verifyQr`                                | `.`           | a verify URL as an SVG QR code                                                                          |
| `normalizeAwardCode`                      | `.`           | a typed short code folded to its 12 canonical characters, or null                                       |
| `VerifyAwardQuery`                        | `./node`      | the public `award.verify` query, with `VerifyAwardInput` and `VerifyAwardOutput`                        |
| `AwardPermissions`                        | `./node`      | `achievements.award.read` (L0), the permission the public verify query derives                          |
| `registerAwardRecipients`                 | `./node`      | `[{ model: "workforce.member", rules: MEMBER_AWARD_RULES }]`                                            |
| `AwardKindService`                        | `./node`      | `open`, `archive`, `draftCriteria`, `publishCriteria`                                                   |
| `AwardService`                            | `./node`      | `grant`, `consider`, `revoke`, `awardsOf`, `verify`, `verifyCode`, `certificateOf`, `renderCertificate` |
| `AwardKind`, `Award`, `AwardVerification` | `./node`      | the models: `achievements.award_kinds`, `achievements.awards`, `.award_verifications`                   |
| `AwardPass`, `AwardPassSource`            | `./node`      | the `award` wallet pass kind, built from `certificateOf`'s fields                                       |

## Kinds and grants

```ts
registerAwardRecipients([{ model: "workforce.member", rules: MEMBER_AWARD_RULES }]);

const kind = await kinds.open(scope, {
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
const typed = await awards.verifyCode("7k3q 9xpm oabz"); // case, spaces and look-alikes forgiven
const fields = await awards.certificateOf(award.id, settings.verifyBaseUrl);
// fields.template, fields.verifyUrl, fields.verifyCode, fields.verifyQr (SVG)
const pdf = await awards.renderCertificate(award.id, {
  verifyBaseUrl: settings.verifyBaseUrl,
  template: await studio.published(fields.template), // the kind's print template
  format: DocumentFormat.Pdf,
  pdfEngine,
  recipient: { name: member.displayName },
});
await awards.revoke(award.id, input.reason); // AwardRevoked; the token and code stop resolving
```

`VerifyAwardQuery` (`achievements.award.verify@1`, `GET /awards/verify?token=` or `?code=`) is the public check, in
the public API area so anonymous callers may use it (ADR 0432). It answers `valid` with the award or `not_found`.
The short code is 12 Crockford base32 characters (60 bits) printed as `7K3Q-9XPM-0ABZ`.

The token (32 random bytes, base64url) stays on the award under row-level security. `achievements.award_verifications`
holds only its SHA-256 (and the short code's), the award id and the scope, with no row-level security (ADR 0368 decision 5); `verify` reads it
and opens the award's scope session, so call it from its own public action.

## Wallet passes (ADR 0348 decision 5)

`AwardPass` (`Pass({ key: "award" })`, in `src/node/integrations/`) turns an award's certificate fields into pass
content: the kind's name as title, the level as subtitle, the level, period, grant date and short code as fields, the
award id as serial and the verify URL as the QR code. The recipient's name is never on it. Labels are lang keys
(`achievements::passes.award.*` in `assets/lang/<locale>/achievements.json`, seven locales); the host passes their text
to a `WalletPassIssuer` of `@stackra/integrations/node`:

```ts
const {
  template: _t,
  verifyQr: _q,
  ...award
} = await awards.certificateOf(awardId, settings.verifyBaseUrl);
const content = new AwardPass().content({ ...award, brand });
const { saveUrl } = await google.issue({
  kind: "award",
  content,
  labels,
  locale,
  issuedAt: ctx.now(),
});
```

A revoked award is refused by `certificateOf`; voiding a pass already issued is not built yet (STA-791).

## Tables and scope

`achievements.award_kinds` and `achievements.awards` carry `scope_id` and `scope_path` under forced row-level security
(migration `achievements.0001_create_achievements`, with `ltree`). Kinds are unique per scope and key. Migration
`achievements.0002_add_award_codes_and_unique_grants` adds the short code and a partial unique index on live awards per
kind, recipient and period, so the loser of two concurrent period grants is refused as `period_taken`.

## Not here

- Points (`@stackra/loyalty-kit`), leaderboards (report widgets), goals and Open Badges. Wallet pass signing and
  issuing: `@stackra/integrations/node`.
- Whether an AI principal may grant: a platform floor the calling action checks (ADR 0368 open questions).
- The `awk`, `awd` and `awv` rows of gen's public id prefix registry (`PUBLIC_ID_PREFIXES` in `@stackra/gen`).
