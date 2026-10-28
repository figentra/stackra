---
"@stackra/privacy": patch
---

`@stackra/privacy` declares `@stackra/queue` and `@stackra/scheduler`, which gen's generated registrations of its jobs
import (gen refused the package with `generated_dependency_missing`). Its test config merges gen's
`./.stackra/vitest.config`.
