# Plan: @stackra/ui rich-text subpath (STA-1895)

1. Add the stand-in barrel `src/react/rich-text-editor/index.ts`; drop the four rich-text lines from
   `src/react/index.ts`.
2. Add `./rich-text` to `package.json` `exports` and a `rich-text` entry to `tsdown.config.ts`.
3. Switch the five playground demos to `@stackra/ui/rich-text`.
4. Add `src/__tests__/entry-boundary.test.ts`: walks each entry's source imports and asserts none reaches `@tiptap/*`.
5. Update the package README and AGENTS.md; add a changeset (`@stackra/ui` minor, breaking move).
6. Verify: build `@stackra/ui` and a minimal consumer Vite build on the testbed.
