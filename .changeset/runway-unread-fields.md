---
"@stackra/runway": patch
"@stackra/repo-checks": minor
---

The 32 runway fields that the repositories set but nothing reads yet now say so in their JSON Schema description, with
the work that will read them ("Not read yet (Runway plan PR 12, STA-2001)"); `environments.*.deploy.gate` is marked a
deprecated alias of `release.gate`. No field is removed and parsing is unchanged. `@stackra/repo-checks` adds the
`runway-unread-fields` structure check (`checkRunwayUnreadFields`, `RUNWAY_UNREAD_FIELDS`): it fails when the list and
the schema notes disagree, or when the runway, CLI, gen or infra sources read a field still listed as not read.
