/**
 * Stackra file contract:
 * Purpose: the `ui-rich-text-entry` codemod fixture (0.4.0): an app that imports the editor and its types from
 *          `@stackra/ui/react` beside other components, a type-only import, a file that already imports from the new
 *          entry, a re-export, and a namespace import whose use is reported.
 * Boundary: test fixture only; the sources are strings, never compiled.
 * Runtime: node (vitest)
 * Governing contract: ADR 0199 (Enforcement); STA-145; changeset 149ca06.
 */
import type { CodemodFixture } from "#node/upgrade/constants/__tests__/fixtures/codemod-fixture.type";

export const UI_RICH_TEXT_ENTRY_FIXTURE: CodemodFixture = {
  files: [
    {
      path: "apps/console/src/notes/note-editor.tsx",
      before: `import { Button, RichTextEditor, type RichTextEditorProps } from "@stackra/ui/react";
import type { RichTextContribution } from "@stackra/ui/react";

export function NoteEditor(props: RichTextEditorProps & { extra: RichTextContribution }) {
  return (
    <>
      <RichTextEditor {...props} />
      <Button>Save</Button>
    </>
  );
}
`,
      after: `import { Button } from "@stackra/ui/react";
import { RichTextEditor, type RichTextEditorProps } from "@stackra/ui/rich-text";
import type { RichTextContribution } from "@stackra/ui/rich-text";

export function NoteEditor(props: RichTextEditorProps & { extra: RichTextContribution }) {
  return (
    <>
      <RichTextEditor {...props} />
      <Button>Save</Button>
    </>
  );
}
`,
    },
    {
      path: "apps/console/src/notes/toolbar.tsx",
      before: `import { RichTextEditor as Editor } from "@stackra/ui/react";
import { type RichTextContribution } from "@stackra/ui/rich-text";

export const toolbar: RichTextContribution[] = [];
export const NotesEditor = Editor;
`,
      after: `import { type RichTextContribution, RichTextEditor as Editor } from "@stackra/ui/rich-text";

export const toolbar: RichTextContribution[] = [];
export const NotesEditor = Editor;
`,
    },
    {
      path: "packages/kit/src/index.ts",
      before: `export { Card, RichTextToolbarItem } from '@stackra/ui/react';
export type { RichTextEditorProps } from '@stackra/ui/react';
`,
      after: `export { Card } from '@stackra/ui/react';
export { RichTextToolbarItem } from '@stackra/ui/rich-text';
export type { RichTextEditorProps } from '@stackra/ui/rich-text';
`,
    },
    {
      path: "apps/console/src/notes/legacy.tsx",
      before: `import * as ui from "@stackra/ui/react";

export const Legacy = () => <ui.RichTextEditor value="" />;
`,
      after: `import * as ui from "@stackra/ui/react";

export const Legacy = () => <ui.RichTextEditor value="" />;
`,
      findings: ["3:30"],
    },
  ],
};
