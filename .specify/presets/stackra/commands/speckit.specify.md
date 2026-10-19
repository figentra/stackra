---
description: Create the spec, interview the Impact questionnaire, then hand off to clarify.
strategy: wrap
---

{CORE_TEMPLATE}

## Stackra: Impact questionnaire (mandatory)

The spec template carries an `## Impact` section. After drafting, ask the user each question in it
(apps, services, packages, cross-service events, tenancy/data, secrets, Linear project/issue,
ADR needed, new dependencies) and write the answers in. Never guess an answer: leave it as
`[NEEDS CLARIFICATION: ...]`. Leave `**Clarifications status**` as `pending`. Do not run
`/speckit.plan`: the next step is always `/speckit.clarify`.
