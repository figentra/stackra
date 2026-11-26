---
"@stackra/flow-preset": patch
---

The preset's pre-commit `oxlint` and `oxfmt` steps exclude the opencode guard plugin `.opencode/plugins/fflow-guard.mjs`, as they already excluded the hook copy. A repository whose oxlint config ignores that file, and which staged only it, was refused with "No files found to lint" (oxlint exits 1 when every file it is given is ignored); oxfmt would have checked a byte-pinned bundle.
