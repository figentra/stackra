---
"@stackra/ui": minor
---

`@stackra/ui/contracts` stops redefining the shared enums (STA-1383). Breaking:

- `Tone` is removed; use the one `Tone` of `@stackra/contracts` (same five codes). It is an `Enum.of` value, so iterate
  it with `Enum.values(Tone)` instead of `Tone.map`.
- `ErrorKind` is renamed `ErrorStateKind` (the four kinds an `ErrorState` shows; `@stackra/errors`' `ErrorKind` is the
  ten refusal kinds).
- `SortDirection` is renamed `AriaSortDirection` (`ascending`, `descending`, the `aria-sort` spelling; contracts'
  `SortDirection` is the `asc`/`desc` wire code).

`@stackra/ui` now depends on `@stackra/contracts`.
