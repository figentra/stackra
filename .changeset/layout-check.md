---
"@stackra/repo-checks": minor
"@stackra/cli": minor
---

`stackra validate --repository` checks the repository layout (ADR 0526): the root holds only its Flow preset's
template entries, its member folders, `tools/` with a README and the extras package.json `stackra.layout.allow`
declares with a reason; never a root `src/` or a `scripts/` or `bin/` folder, and no path named `figentra-flow`.
