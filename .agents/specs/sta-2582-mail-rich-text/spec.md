# Feature Specification: tenant and client HTML in a mail body is sanitized

**Feature Branch**: `figentra/sta-2582-sanitize-email-html`

**Created**: 2026-11-26

**Status**: Tasked

**Tier**: feature

**Approver**: leader

**Linear**: STA-2582

**Clarifications status**: complete

**Input**: A mail body (`*.mail.tsx`, ADR 0223 as amended by ADR 0294) had no safe way to carry HTML that a tenant or
a client wrote, such as a branch's welcome note from the console editor. React escaped it as plain text, and the only
way to render it was a raw `dangerouslySetInnerHTML`, which nothing stopped. That HTML reaches every mail client that
renders the message, so an unsanitized sink is a stored XSS and tracking risk. `@stackra/csp` already ships
`sanitizeHtml` (STA-2562 audit item b), the one HTML sanitizer; the mail renderer did not use it.

### Sources

- `packages/communication/notifications/src/react/mail/mail-tools.type.ts` (the `MailTools` contract `useMail()`
  returns)
- `packages/communication/notifications/src/react/mail/render-mail-body.function.tsx` (`toolsFor`, the renderer)
- `packages/security/csp/src/core/functions/sanitize-html.function.ts` (`sanitizeHtml`, its floor and
  `RICH_TEXT_HTML_POLICY`)
- `packages/tooling/oxlint/src/base.jsonc` (the shared lint preset and its overrides)
- ADR 0086 and ADR 0223 (notifications), ADR 0294 (`.mail.tsx` bodies), ADR 0305 (hooks as class fields)
- stackra#1119 and its independent review (two low notes, recorded under Risks)

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: notifications (`MailTools.richText`, the renderer, tests, README, AGENTS.md, a dependency on
  `@stackra/csp`); oxlint-config (a `react/no-danger` override for `*.mail.tsx`, its test and fixtures, README,
  AGENTS.md); csp (AGENTS.md note only)
- **Public contract change**: `MailTools` (the return type of `useMail()` from `@stackra/notifications/react`) gains
  `readonly richText: (html: string, policy?: HtmlPolicy) => ReactElement`; `@stackra/oxlint-config` reports
  `react/no-danger` at error in `**/*.mail.tsx`
- **Cross-service events**: none
- **Tenancy and data**: none stored or read; the renderer sanitizes HTML the caller already holds for the recipient's
  tenant
- **Security and privacy**: closes the raw-HTML sink in mail bodies; no script, style, event handler, `style`
  attribute, image or non-http(s)/mailto link survives the default policy
- **Secrets**: none
- **ADR needed**: no (implements ADR 0223 as amended by ADR 0294, with the sanitizer STA-2562 already set as the one
  HTML pass)
- **New dependencies**: `@stackra/csp` (workspace) in `@stackra/notifications`; no third-party package
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none (mail bodies only)
- **Docs to update**: packages/communication/notifications/README.md and AGENTS.md, packages/tooling/oxlint/README.md
  and AGENTS.md, packages/security/csp/AGENTS.md
- **Lane**: full
- **Change risk**: R2 (an added member on a published interface, a new lint error in mail bodies, and a security sink
  behind an allowlist)

## Contract

`useMail()` returns `MailTools`. The interface is built only inside the package (`toolsFor` in the renderer); hosts
read it, they never implement it, so the added member breaks no caller. A mail body reads
`const { richText } = this.mail` and renders `richText(html)` where it wants tenant or client HTML. `richText` returns
one `<div>` whose inner HTML is `sanitizeHtml(html, policy)`; that `<div>` is the package's only
`dangerouslySetInnerHTML`. Every other string a body passes (a prop, an ICU value through `t`) is still escaped by
React. The plain-text part is derived from the rendered HTML, so it carries the sanitized text and nothing dropped.

`policy` is passed to `sanitizeHtml` as given: it replaces `RICH_TEXT_HTML_POLICY` rather than being intersected with
it. `sanitizeHtml`'s floor holds under any policy: script-capable elements (`script`, `style`, `iframe`, `svg`, …) go
with their content, `base`, `meta`, `link`, `embed` and form controls go, and event handlers, `style`, `srcdoc` and
`formaction` are never kept.

## Compatibility and migration

- Additive for every consumer of `@stackra/notifications/react`; a minor changeset for `@stackra/notifications`.
- A `*.mail.tsx` file that writes `dangerouslySetInnerHTML` now fails lint (`react/no-danger`, error, in the last
  override so nothing later turns it off). Migration: replace the site with `richText(html)`. No such site exists in
  this repository today; the changeset for `@stackra/oxlint-config` is minor and names the fix.
- `@stackra/notifications` now depends on `@stackra/csp` (same repo, isomorphic, no DOM), so the boundary direction is
  unchanged.

## Risks

- A host that passes a wider `policy` (for example allowing `img` with `src`) lets tenant HTML carry remote images or
  tracking pixels; script stays impossible because of the floor. The README and changeset call the parameter a
  narrowing, which the code does not enforce. Follow-up from the review: intersect the given policy with the default
  and test it, or correct the wording.
- The lint guard covers `**/*.mail.tsx` only; a helper component in a plain `.tsx` file that a mail body renders is
  not linted. Follow-up from the review: widen the glob to the mail helpers folder or document the convention.

## Acceptance criteria

- **AC-001**: THE `MailTools` interface returned by `useMail()` SHALL expose
  `richText(html: string, policy?: HtmlPolicy): ReactElement`.
- **AC-002**: WHEN a mail body passes tenant or client HTML to `richText` THE renderer SHALL write back, inside one
  `<div>`, only what `sanitizeHtml` keeps under `RICH_TEXT_HTML_POLICY`, with no script, iframe, image, event handler,
  `style` attribute or `javascript:` link.
- **AC-003**: WHEN a mail body passes the same HTML as a prop or as an ICU value THE renderer SHALL escape it as text.
- **AC-004**: WHEN a mail body uses `richText` THE plain-text part SHALL carry the sanitized text and none of the
  dropped content.
- **AC-005**: WHERE a host passes a `policy` THE renderer SHALL sanitize under that policy, and `sanitizeHtml`'s floor
  SHALL still drop script, style and event handlers.
- **AC-006**: IF a mail body file (`*.mail.tsx`) writes `dangerouslySetInnerHTML` THEN THE lint preset SHALL report
  `react/no-danger` at error.
- **AC-007**: WHEN the same markup is in a `.tsx` file that is not a mail body THE mail override SHALL report nothing.

## Open questions

None. The two review notes are follow-ups, recorded under Risks.

## Status history

- 2026-11-26 → Clarified (the PR diff and its independent review)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Tasked (tasks.md; built in the same branch)
