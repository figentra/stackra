/**
 * Stackra file contract:
 * Purpose: the web `RichTextEditor` on TipTap v3 core: a labelled document field with a toolbar (bold, italic,
 *          underline, strike, three heading levels, bullet and numbered lists, quote, code, link, undo and redo), a
 *          placeholder, read-only and disabled states, a character count and limit, and the editor contributions of ADR
 *          0466: packages add TipTap extensions, toolbar buttons and a side panel for the document kinds they name.
 *          The value is ProseMirror JSON or HTML, controlled or not; `format` picks what `onChange` reports.
 * Boundary: the toolbar is HeroUI's Toolbar (React Aria: one tab stop, arrow keys move between buttons and flip in
 *           right-to-left) with ToggleButtons that report their pressed state; TipTap's own shortcuts (Mod-B, Mod-Z…)
 *           work in the text. Every block carries `dir="auto"` (TipTap's `textDirection`), and text aligns to each
 *           block's start, so Arabic and English paragraphs sit side by side correctly. Colours are tokens only. HTML
 *           comes in parsed to the schema, so unknown markup and scripts are dropped; links refuse `javascript:`.
 * Runtime: browser
 * Governing contract: ADR 0466 (decisions 1, 3, 5, 7 and 8); ADR 0302 (decision 3); ADR 0055 (one field contract);
 *          ADR 0060 (right-to-left); STA-1371; WCAG 2.2 SC 1.3.1, 2.1.1, 4.1.2.
 */
import {
  cn,
  Description,
  Input,
  Label,
  Separator,
  TextField,
  ToggleButton,
  Toolbar,
} from "@heroui/react";
import type { Content, Editor } from "@tiptap/core";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Fragment, useEffect, useId, useState, type ReactElement } from "react";

import type { RichTextNode } from "#contracts/types/rich-text-node.type";
import { RICH_TEXT_EDITOR_KEYS } from "#core/constants/rich-text-editor-keys.constant";
import { Button } from "#react/button/button";
import { FieldError } from "#react/field-error/field-error";
import { useUiText } from "#react/hooks/use-ui-text";
import { BLOCK_DIRECTION } from "#react/rich-text-editor/block-direction.constant";
import { Icon } from "#react/icon/icon";
import { IconButton } from "#react/icon-button/icon-button";
import type { RichTextContribution } from "#react/rich-text-editor/rich-text-contribution.type";
import type { RichTextEditorProps } from "#react/rich-text-editor/rich-text-editor.props";
import type { RichTextToolbarItem } from "#react/rich-text-editor/rich-text-toolbar-item.type";

const K = RICH_TEXT_EDITOR_KEYS.ui.rich_text_editor;

/** The document's look: tokens only, logical sides, each block aligned to its own start. */
const CONTENT = [
  "[&_.tiptap]:min-h-32 [&_.tiptap]:px-3 [&_.tiptap]:py-2 [&_.tiptap]:text-start [&_.tiptap]:text-sm",
  "[&_.tiptap]:leading-relaxed [&_.tiptap]:outline-none [&_.tiptap>*+*]:mt-3",
  "[&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold",
  "[&_ul]:list-disc [&_ul]:ps-5 [&_ol]:list-decimal [&_ol]:ps-5 [&_li>p]:m-0",
  "[&_blockquote]:border-s-2 [&_blockquote]:border-separator [&_blockquote]:ps-3 [&_blockquote]:text-muted",
  "[&_code]:rounded-[var(--radius-control-inner)] [&_code]:bg-default/60 [&_code]:px-1 [&_code]:font-mono",
  "[&_code]:text-[0.9em] [&_pre]:rounded-[var(--radius-control)] [&_pre]:bg-default [&_pre]:p-3",
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_a]:text-link [&_a]:underline [&_a]:underline-offset-2",
  "[&_p.is-editor-empty:first-child]:before:pointer-events-none [&_p.is-editor-empty:first-child]:before:float-start",
  "[&_p.is-editor-empty:first-child]:before:h-0 [&_p.is-editor-empty:first-child]:before:text-field-placeholder",
  "[&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
].join(" ");

/** The value in the form TipTap takes; the readonly JSON is never mutated by it. */
const contentOf = (value: RichTextNode | string | undefined) => (value ?? "") as Content;

/** The value as a comparable string. */
const keyOf = (value: RichTextNode | string) =>
  typeof value === "string" ? value : JSON.stringify(value);

/** The default, one stable empty list. */
const NO_CONTRIBUTIONS: readonly RichTextContribution[] = [];

/** A rich-text document field. */
export function RichTextEditor({
  format = "json",
  placeholder,
  characterLimit,
  hasCharacterCount = false,
  contributions = NO_CONTRIBUTIONS,
  documentKind,
  label,
  description,
  errorMessage,
  isRequired,
  isInvalid,
  isDisabled = false,
  isReadOnly = false,
  value,
  defaultValue,
  onChange,
  name,
  className,
  "aria-label": ariaLabel,
}: RichTextEditorProps): ReactElement {
  const t = useUiText();
  const id = useId();
  const [linkDraft, setLinkDraft] = useState<string | null>(null);
  const active = contributions.filter(
    (contribution) =>
      documentKind === undefined || (contribution.kinds?.includes(documentKind) ?? true),
  );
  const isEditable = !isDisabled && !isReadOnly;
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;
  const countId = `${id}-count`;
  const errorId = `${id}-error`;
  const isCountShown = hasCharacterCount || characterLimit !== undefined;
  const describedBy = [
    description == null ? null : descriptionId,
    isCountShown ? countId : null,
    isInvalid && errorMessage ? errorId : null,
  ]
    .filter(Boolean)
    .join(" ");

  // No dependencies: the editor is created once with its extensions (contributions, limit), and TipTap re-applies
  // these options on every render, so `onUpdate` and the attributes always see the latest props.
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      // Read from the root's attributes, which follow the prop (a locale switch) without a new editor.
      Placeholder.configure({
        placeholder: ({ editor: current }) => current.view.dom.dataset["placeholder"] ?? "",
      }),
      CharacterCount.configure({ limit: characterLimit ?? null }),
      BLOCK_DIRECTION,
      ...active.flatMap((contribution) => contribution.extensions ?? []),
    ],
    content: contentOf(value ?? defaultValue),
    editable: isEditable,
    textDirection: "auto",
    immediatelyRender: true,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        "data-placeholder": placeholder ?? "",
        ...(label == null ? { "aria-label": ariaLabel ?? "" } : { "aria-labelledby": labelId }),
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
        ...(isReadOnly ? { "aria-readonly": "true" } : {}),
        ...(isDisabled ? { "aria-disabled": "true" } : {}),
        ...(isInvalid ? { "aria-invalid": "true" } : {}),
        ...(isRequired ? { "aria-required": "true" } : {}),
      },
    },
    onUpdate: ({ editor: current }) =>
      onChange?.(format === "html" ? current.getHTML() : (current.getJSON() as RichTextNode)),
  });

  // A controlled value that differs from the document replaces it, without reporting a change back.
  useEffect(() => {
    if (value === undefined || editor.isDestroyed) return;
    const current = typeof value === "string" ? editor.getHTML() : JSON.stringify(editor.getJSON());
    if (current === keyOf(value)) return;
    // Not undoable: the author's undo never steps back past a value the app set.
    editor
      .chain()
      .setMeta("addToHistory", false)
      .setContent(contentOf(value), { emitUpdate: false })
      .run();
  }, [editor, value]);

  useEffect(() => {
    editor.setEditable(isEditable, false);
  }, [editor, isEditable]);

  const groups: readonly (readonly RichTextToolbarItem[])[] = [
    [
      mark("bold", "bold", t(K.bold), (e) => e.chain().focus().toggleBold().run()),
      mark("italic", "italic", t(K.italic), (e) => e.chain().focus().toggleItalic().run()),
      mark("underline", "underline", t(K.underline), (e) =>
        e.chain().focus().toggleUnderline().run(),
      ),
      mark("strike", "strikethrough", t(K.strike), (e) => e.chain().focus().toggleStrike().run()),
      mark("code", "code", t(K.code), (e) => e.chain().focus().toggleCode().run()),
    ],
    ([1, 2, 3] as const).map((level) => ({
      id: `heading-${level}`,
      label: t(K.heading, { level }),
      icon: `heading-${level}` as const,
      onPress: (e: Editor) => e.chain().focus().toggleHeading({ level }).run(),
      isActive: (e: Editor) => e.isActive("heading", { level }),
    })),
    [
      mark("bulletList", "list", t(K.bullet_list), (e) =>
        e.chain().focus().toggleBulletList().run(),
      ),
      mark("orderedList", "list-ordered", t(K.ordered_list), (e) =>
        e.chain().focus().toggleOrderedList().run(),
      ),
      mark("blockquote", "quote", t(K.blockquote), (e) =>
        e.chain().focus().toggleBlockquote().run(),
      ),
      {
        id: "link",
        label: t(K.link),
        icon: "link" as const,
        onPress: (e: Editor) =>
          setLinkDraft((e.getAttributes("link")["href"] as string | undefined) ?? ""),
        isActive: (e: Editor) => e.isActive("link"),
      },
    ],
    [
      {
        id: "undo",
        label: t(K.undo),
        icon: "undo-2" as const,
        onPress: (e: Editor) => e.chain().focus().undo().run(),
        isDisabled: (e: Editor) => !e.can().undo(),
      },
      {
        id: "redo",
        label: t(K.redo),
        icon: "redo-2" as const,
        onPress: (e: Editor) => e.chain().focus().redo().run(),
        isDisabled: (e: Editor) => !e.can().redo(),
      },
    ],
    active.flatMap((contribution) => contribution.toolbar ?? []),
  ].filter((group) => group.length > 0);

  // Re-read on every transaction; compared deeply, so a render happens only when a state or the count changes.
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      pressed: groups.flat().map((item) => item.isActive?.(current) ?? null),
      disabled: groups.flat().map((item) => item.isDisabled?.(current) ?? false),
      // The storage is gone on an editor React's strict mode has already destroyed; count nothing there.
      characters:
        (
          current.storage.characterCount as { characters: () => number } | undefined
        )?.characters() ?? 0,
      submitted:
        name === undefined
          ? ""
          : format === "html"
            ? current.getHTML()
            : JSON.stringify(current.getJSON()),
    }),
  });

  const applyLink = () => {
    const href = linkDraft?.trim() ?? "";
    const chain = editor.chain().focus().extendMarkRange("link");
    if (href === "") chain.unsetLink().run();
    else chain.setLink({ href }).run();
    setLinkDraft(null);
  };

  const panels = active.flatMap((contribution) =>
    contribution.panel ? [{ id: contribution.id, node: contribution.panel(editor) }] : [],
  );
  let index = -1;

  return (
    <div
      data-slot="rich-text-editor"
      data-disabled={isDisabled || undefined}
      className={cn(
        "flex w-full min-w-0 flex-col gap-1",
        isDisabled && "status-disabled",
        className,
      )}
    >
      {label == null ? null : (
        <Label id={labelId} isRequired={isRequired ?? false} isInvalid={isInvalid ?? false}>
          {label}
        </Label>
      )}
      <div
        className={cn(
          "overflow-hidden rounded-[var(--field-radius)] border border-[var(--field-border)] bg-field text-field-foreground shadow-field",
          "focus-within:border-[var(--field-border-focus)]",
          isInvalid && "status-invalid-field",
        )}
      >
        {isReadOnly ? null : (
          <Toolbar
            aria-label={t(K.toolbar)}
            className="flex w-full flex-wrap items-center gap-0.5 border-b border-separator p-1"
          >
            {groups.map((group, groupIndex) => (
              <Fragment key={group[0]?.id ?? groupIndex}>
                {groupIndex > 0 ? <Separator orientation="vertical" className="mx-1 h-5" /> : null}
                {group.map((item) => {
                  index += 1;
                  const pressed = state.pressed[index] ?? null;
                  const disabled = isDisabled || (state.disabled[index] ?? false);
                  const icon =
                    typeof item.icon === "string" ? <Icon name={item.icon} size="sm" /> : item.icon;
                  return pressed === null ? (
                    <IconButton
                      key={item.id}
                      icon={item.icon}
                      label={item.label}
                      variant="ghost"
                      size="sm"
                      isDisabled={disabled}
                      onPress={() => item.onPress(editor)}
                    />
                  ) : (
                    <ToggleButton
                      key={item.id}
                      aria-label={item.label}
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      isSelected={pressed}
                      isDisabled={disabled}
                      onChange={() => item.onPress(editor)}
                    >
                      {icon}
                    </ToggleButton>
                  );
                })}
              </Fragment>
            ))}
          </Toolbar>
        )}
        {linkDraft === null ? null : (
          <div className="flex flex-wrap items-end gap-2 border-b border-separator p-2">
            <TextField
              aria-label={t(K.link_address)}
              type="url"
              value={linkDraft}
              onChange={setLinkDraft}
              className="min-w-0 flex-1"
            >
              <Input
                // oxlint-disable-next-line jsx-a11y/no-autofocus -- the link form opens on a press of its button
                autoFocus
                dir="ltr"
                placeholder="https://"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    applyLink();
                  } else if (event.key === "Escape") {
                    event.preventDefault();
                    setLinkDraft(null);
                    editor.commands.focus();
                  }
                }}
              />
            </TextField>
            <Button size="sm" onPress={applyLink}>
              {t(K.link_apply)}
            </Button>
            {editor.isActive("link") ? (
              <Button
                size="sm"
                variant="ghost"
                onPress={() => {
                  editor.chain().focus().extendMarkRange("link").unsetLink().run();
                  setLinkDraft(null);
                }}
              >
                {t(K.link_remove)}
              </Button>
            ) : null}
          </div>
        )}
        <div className={cn(panels.length > 0 && "grid md:grid-cols-[minmax(0,1fr)_16rem]")}>
          <EditorContent editor={editor} className={CONTENT} />
          {panels.map((panel) => (
            <aside
              key={panel.id}
              className="border-t border-separator p-3 md:border-t-0 md:border-s"
            >
              {panel.node}
            </aside>
          ))}
        </div>
      </div>
      {isCountShown ? (
        <p id={countId} dir="auto" className="m-0 text-end text-xs text-muted tabular-nums">
          {characterLimit === undefined
            ? t(K.count, { count: state.characters })
            : t(K.count_limit, { count: state.characters, limit: characterLimit })}
        </p>
      ) : null}
      {description == null ? null : <Description id={descriptionId}>{description}</Description>}
      {isInvalid && errorMessage ? (
        <FieldError id={errorId} isInvalid>
          {errorMessage}
        </FieldError>
      ) : null}
      {name === undefined ? null : <input type="hidden" name={name} value={state.submitted} />}
    </div>
  );
}

/** A built-in toggle for a mark or node that shows pressed when it is at the selection. */
function mark(
  type: string,
  icon:
    | "bold"
    | "italic"
    | "underline"
    | "strikethrough"
    | "code"
    | "list"
    | "list-ordered"
    | "quote",
  label: string,
  onPress: (editor: Editor) => void,
): RichTextToolbarItem {
  return { id: type, label, icon, onPress, isActive: (editor) => editor.isActive(type) };
}
