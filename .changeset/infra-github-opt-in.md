---
"@stackra/infra-github": minor
---

`githubStack` takes `options` (STA-2115): the OIDC subject template (`oidcTemplate`) and the committed rulesets and
branch protection (`rules`) are opt-in and off by default, so a stacks repository can manage repositories whose
subjects are immutable or custom, and whose rules a tool such as Flow renders. Pass `{ oidcTemplate: true, rules: true }`
for the previous behaviour.
