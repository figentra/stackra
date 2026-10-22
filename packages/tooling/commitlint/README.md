# @stackra/commitlint-config

The commitlint preset. A repo's `.commitlintrc.yaml` is:

```yaml
extends:
  - "@stackra/commitlint-config"
rules:
  refs-issue-key:
    - 2
    - always
    - STA
```

The preset extends `@commitlint/config-conventional` and sets the house type list, subject case, `scope-case` off
(member short names may carry digits) and the header and body lengths.

| Rule             | Default | Meaning                                                                                                                        |
| ---------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `refs-issue-key` | off     | The value is the issue prefix. A `feat`, `fix`, `refactor` or `perf` commit then needs a `Refs: <PREFIX>-n` footer (ADR 0065). |

The rule checks the footer's prefix and shape; whether the issue exists is `pnpm linear check-pr`'s job.
