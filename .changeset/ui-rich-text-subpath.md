---
"@stackra/ui": minor
---

Add the `@stackra/ui/rich-text` subpath (STA-1895). The web `RichTextEditor` and its `RichTextEditorProps`,
`RichTextContribution` and `RichTextToolbarItem` types move there from `@stackra/ui/react`, so no other entry imports
`@tiptap/*`. Vite stubs a missing optional peer, so 0.3.0 failed a consumer build that had no TipTap installed with
`MISSING_EXPORT` for `CharacterCount`, `Placeholder` and `EditorContent`. The `@tiptap/*` peers stay optional.

### Breaking

- `RichTextEditor` and its three types are no longer exported from `@stackra/ui/react`. Change
  `import { RichTextEditor } from "@stackra/ui/react"` to `import { RichTextEditor } from "@stackra/ui/rich-text"`.
  Only an app that renders the editor needs the `@tiptap/*` peers.
