---
"@stackra/infra-aws": minor
---

`awsBaselineConfig` refuses `media.scanner: guard_duty` over a files bucket with `shared.buckets.versioning: false`
(`RunwayInvalidError` at `environments.<env>.shared.buckets.versioning`): the `guard_duty` scanner of `@stackra/media`
pins GuardDuty's verdict to an object version (STA-669). Versioning stays on by default; a runway that turned it off
turns it back on or selects `clamav`.
