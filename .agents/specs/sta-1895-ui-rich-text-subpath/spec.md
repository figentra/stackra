# Feature Specification: @stackra/ui rich-text subpath

**Linear**: STA-1895 · **Status**: Approved (the issue names the fix)

## Impact

- **Apps touched**: `apps/playground` (five rich-text demos change their import)
- **Services touched**: none
- **Packages touched**: `packages/design-system/ui`
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no; ADR 0294 decision 15 (entries), ADR 0165 and 0302 govern
- **New dependencies**: none (the `@tiptap/*` peers stay optional)
- **Deploy modes**: all (a library)

## Problem

`@stackra/ui` 0.3.0 re-exports `RichTextEditor` from `./react`, which imports `@tiptap/*` statically. A consumer
without those optional peers gets a Vite stub and `MISSING_EXPORT` errors, so builds that worked on 0.2.0 fail.

## Requirements

1. `@stackra/ui/rich-text` exports `RichTextEditor` and its three public types; `./react` no longer does.
2. No other entry's source graph reaches `@tiptap/*`; a test proves it.
3. `@tiptap/*` stay optional peers. The change is a breaking move, stated in the changeset (minor while 0.x).
4. In-repo consumers import from the new subpath.
