---
"@stackra/skills": minor
"@stackra/repo-checks": minor
"@stackra/cli": minor
---

Member metadata for people and agents (ADR 0453 decision 11, amendment of 2026-10-27, STA-1072). `@stackra/skills`
adds the `package` kind's `tier`, `category`, `runtimes` and `summary` to `StackraManifest` and
`STACKRA_MANIFEST_SCHEMA`, with the vocabularies `StackraTier`, `StackraCategory` and `StackraRuntime`.
`@stackra/repo-checks` adds `checkMemberMetadata` (keywords, repository, homepage, bugs, author, engines, the `stackra`
field against the folder and its turbo tags), `npmMetadataFor`, `turboTagsFor` and `MEMBER_METADATA`, run by the
`structure` phase in the Stackra repository. `stackra new` writes the field, the tags and `--summary`.
