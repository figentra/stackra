/**
 * Stackra file contract:
 * Purpose: the page of the RichTextEditor route: `@stackra/ui-pro`'s RichTextEditor, a Tiptap editor with a toolbar of
 *          format and history buttons, a link popover and a character count, as an editable editor, a disabled one and a
 *          read-only one.
 * Boundary: presentation and local state only. Each toolbar and each editing area is named; the buttons take their names
 *          from HeroUI Pro (Bold, Undo and so on) and carry a text glyph, since the playground draws no icon here.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import type { JSONContent } from "@tiptap/core";
import * as UiPro from "@stackra/ui-pro/react";

import { ProRichTextEditorRoute } from "#src/routes/pro-rich-text-editor/pro-rich-text-editor.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-rich-text-editor.*` keys.
const STRINGS = {
  documentTitle: `${ProRichTextEditorRoute.title} · Stackra Playground`,
  intro:
    "A rich text editor. Format the selection with the toolbar or the keyboard, undo and redo, add a link, and watch the character and word count.",
  editable: "Editable",
  editableToolbar: "Formatting",
  editableArea: "Release notes, editable",
  disabled: "Disabled",
  disabledToolbar: "Formatting, disabled",
  disabledArea: "Release notes, disabled",
  readOnly: "Read only",
  readOnlyToolbar: "Formatting, read only",
  readOnlyArea: "Release notes, read only",
  placeholder: "Start writing…",
  history: "History",
  style: "Text style",
  blocks: "Blocks",
  links: "Lists and links",
  link: "Link",
  footer: "Rich text",
  title: "Release notes",
  body: "Select some text and format it with the toolbar.",
} as const;

const DOCUMENT: JSONContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: STRINGS.title }],
    },
    { type: "paragraph", content: [{ type: "text", text: STRINGS.body }] },
  ],
};

/** The options of an editor: the accessible name of its editing area, kept in one object so it is stable. */
function optionsOf(name: string) {
  return { editorProps: { attributes: { "aria-label": name } } };
}

const EDITABLE_OPTIONS = optionsOf(STRINGS.editableArea);
const DISABLED_OPTIONS = optionsOf(STRINGS.disabledArea);
const READ_ONLY_OPTIONS = optionsOf(STRINGS.readOnlyArea);

/** A glyph for a button: text, hidden from screen readers, since the button is named by HeroUI Pro. */
function Glyph({ children, className }: { children: string; className?: string }) {
  return (
    <span aria-hidden="true" className={className ?? "text-sm"}>
      {children}
    </span>
  );
}

/** The toolbar of an editor: history, text style, blocks, lists and the link popover. */
function Toolbar({ label }: { readonly label: string }) {
  return (
    <UiPro.RichTextEditor.Toolbar label={label}>
      <UiPro.RichTextEditor.ToolbarGroup aria-label={STRINGS.history}>
        <UiPro.RichTextEditor.ActionButton action="undo">
          <Glyph>↶</Glyph>
        </UiPro.RichTextEditor.ActionButton>
        <UiPro.RichTextEditor.ActionButton action="redo">
          <Glyph>↷</Glyph>
        </UiPro.RichTextEditor.ActionButton>
      </UiPro.RichTextEditor.ToolbarGroup>
      <UiPro.RichTextEditor.ToolbarSeparator />
      <UiPro.RichTextEditor.ToolbarGroup aria-label={STRINGS.style}>
        <UiPro.RichTextEditor.ToggleButton command="bold">
          <Glyph className="text-sm font-bold">B</Glyph>
        </UiPro.RichTextEditor.ToggleButton>
        <UiPro.RichTextEditor.ToggleButton command="italic">
          <Glyph className="text-sm italic">I</Glyph>
        </UiPro.RichTextEditor.ToggleButton>
        <UiPro.RichTextEditor.ToggleButton command="underline">
          <Glyph className="text-sm underline">U</Glyph>
        </UiPro.RichTextEditor.ToggleButton>
      </UiPro.RichTextEditor.ToolbarGroup>
      <UiPro.RichTextEditor.ToolbarSeparator />
      <UiPro.RichTextEditor.ToolbarGroup aria-label={STRINGS.blocks}>
        <UiPro.RichTextEditor.ToggleButton command="heading-1">
          <Glyph>H1</Glyph>
        </UiPro.RichTextEditor.ToggleButton>
        <UiPro.RichTextEditor.ToggleButton command="heading-2">
          <Glyph>H2</Glyph>
        </UiPro.RichTextEditor.ToggleButton>
        <UiPro.RichTextEditor.ToggleButton command="blockquote">
          <Glyph>“</Glyph>
        </UiPro.RichTextEditor.ToggleButton>
      </UiPro.RichTextEditor.ToolbarGroup>
      <UiPro.RichTextEditor.ToolbarSeparator />
      <UiPro.RichTextEditor.ToolbarGroup aria-label={STRINGS.links}>
        <UiPro.RichTextEditor.ToggleButton command="bulletList">
          <Glyph>•</Glyph>
        </UiPro.RichTextEditor.ToggleButton>
        <UiPro.RichTextEditor.ToggleButton command="orderedList">
          <Glyph>1.</Glyph>
        </UiPro.RichTextEditor.ToggleButton>
        <UiPro.RichTextEditor.LinkPopover>
          <UiPro.RichTextEditor.LinkPopover.Trigger>
            <Glyph>{STRINGS.link}</Glyph>
          </UiPro.RichTextEditor.LinkPopover.Trigger>
          <UiPro.RichTextEditor.LinkPopover.Content>
            <UiPro.RichTextEditor.LinkPopover.Input />
            <UiPro.RichTextEditor.LinkPopover.Actions>
              <UiPro.RichTextEditor.LinkPopover.UnsetButton />
              <UiPro.RichTextEditor.LinkPopover.ApplyButton />
            </UiPro.RichTextEditor.LinkPopover.Actions>
          </UiPro.RichTextEditor.LinkPopover.Content>
        </UiPro.RichTextEditor.LinkPopover>
      </UiPro.RichTextEditor.ToolbarGroup>
    </UiPro.RichTextEditor.Toolbar>
  );
}

/** An editor with its toolbar, editing area and footer, the one shape of every editor on the page. */
function Editor({
  toolbar,
  options,
  ...props
}: Omit<UiPro.RichTextEditorProps, "children" | "editorOptions"> & {
  readonly toolbar: string;
  readonly options: ReturnType<typeof optionsOf>;
}) {
  return (
    <UiPro.RichTextEditor
      className="w-full max-w-3xl"
      defaultValue={DOCUMENT}
      editorOptions={options}
      placeholder={STRINGS.placeholder}
      {...props}
    >
      <UiPro.RichTextEditor.Shell>
        <Toolbar label={toolbar} />
        <UiPro.RichTextEditor.Content />
        <UiPro.RichTextEditor.Footer>
          <span>
            <bdi>{STRINGS.footer}</bdi>
          </span>
          <UiPro.RichTextEditor.CharacterCount showWords />
        </UiPro.RichTextEditor.Footer>
      </UiPro.RichTextEditor.Shell>
    </UiPro.RichTextEditor>
  );
}

/** The RichTextEditor page. */
export function ProRichTextEditor() {
  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProRichTextEditorRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="editable-heading" className="grid gap-3">
        <h2 id="editable-heading" className="type-h2">
          {STRINGS.editable}
        </h2>
        <Editor toolbar={STRINGS.editableToolbar} options={EDITABLE_OPTIONS} />
      </section>
      <section aria-labelledby="disabled-heading" className="grid gap-3">
        <h2 id="disabled-heading" className="type-h2">
          {STRINGS.disabled}
        </h2>
        <Editor toolbar={STRINGS.disabledToolbar} options={DISABLED_OPTIONS} isDisabled />
      </section>
      <section aria-labelledby="read-only-heading" className="grid gap-3">
        <h2 id="read-only-heading" className="type-h2">
          {STRINGS.readOnly}
        </h2>
        <Editor toolbar={STRINGS.readOnlyToolbar} options={READ_ONLY_OPTIONS} isReadOnly />
      </section>
    </article>
  );
}
