/**
 * Stackra file contract:
 * Purpose: the native `RichTextEditor` on tentap (10tap, TipTap v3 in a WebView, ADR 0466 decision 1): a labelled
 *          document field with a toolbar (bold, italic, underline, strike, code, three heading levels, bullet and
 *          numbered lists, quote, link, undo and redo), a placeholder, read-only and disabled states and a character
 *          count and limit. The value is ProseMirror JSON or HTML, controlled or not; `format` picks what `onChange`
 *          reports, and JSON comes out in the web editor's shape (`dir: "auto"` on every block), so a document
 *          round-trips between web and native.
 * Boundary: the toolbar is house IconButtons and ToggleButtons in rows that wrap, so every button shows, and mirror in
 *           right-to-left with the app (the provider's layout direction). The document is drawn inside a 200-point
 *           WebView that scrolls inside, with CSS built from the theme's colours (`useThemeColor`): every heading and
 *           paragraph takes the direction of its own text (`unicode-bidi: plaintext`) and aligns to its start, while
 *           list items follow the page, whose base direction is the app's, so lists number from the app's side. tentap's bundled TipTap has no CharacterCount, so a change past `characterLimit` is put back to the
 *           last accepted document (the caret moves to its end). A value with nodes the bundled schema lacks (code
 *           block, rule, contributed nodes) is shown as text and stays read-only, so editing here never drops what the
 *           web wrote. Editor contributions are web-only. `name` is a form adapter's key; nothing native submits it.
 * Runtime: react-native
 * Governing contract: ADR 0466 (decisions 1, 2, 7 and 8); ADR 0302 (decision 3); ADR 0055; ADR 0060; STA-1371.
 */
import {
  CoreBridge,
  PlaceholderBridge,
  RichText,
  TenTapStartKit,
  useBridgeState,
  useEditorBridge,
} from "@10play/tentap-editor";
import { cn, useThemeColor } from "heroui-native";
import { Fragment, useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { View } from "react-native";

import type { RichTextNode } from "#contracts/types/rich-text-node.type";
import { RICH_TEXT_EDITOR_KEYS } from "#core/constants/rich-text-editor-keys.constant";
import { useDirection } from "#native/bidi/use-direction";
import { Button } from "#native/button/button";
import { Description } from "#native/description/description";
import { FieldError } from "#native/field-error/field-error";
import { Icon } from "#native/icon/icon";
import { IconButton } from "#native/icon-button/icon-button";
import { Label } from "#native/label/label";
import type { RichTextEditorProps } from "#native/rich-text-editor/rich-text-editor.props";
import { RICH_TEXT_EDITOR_ICON_NAMES as I } from "#native/rich-text-editor/rich-text-editor-icon-names.constant";
import { richTextPlainOf } from "#core/functions/rich-text-plain-of.function";
import { richTextLengthOf } from "#native/rich-text-editor/rich-text-length-of.function";
import { richTextNativeOf } from "#native/rich-text-editor/rich-text-native-of.function";
import { richTextReportedOf } from "#native/rich-text-editor/rich-text-reported-of.function";
import { Separator } from "#native/separator/separator";
import { Text } from "#native/text/text";
import { TextField } from "#native/text-field/text-field";
import { ToggleButton } from "#native/toggle-button/toggle-button";
import { useUiText } from "#react/hooks/use-ui-text";

const K = RICH_TEXT_EDITOR_KEYS.ui.rich_text_editor;

/** The value as a comparable string. */
const keyOf = (value: RichTextNode | string | undefined) =>
  typeof value === "string" ? value : JSON.stringify(value ?? "");

/** The document's look inside the WebView: theme colours only, each block laid out by its own text. */
const cssOf = (direction: string, colors: readonly string[]) => {
  const [field, text, muted, placeholder, separator, code, link] = colors;
  return `
    html, body { direction: ${direction}; background: ${field}; color: ${text}; margin: 0; }
    .ProseMirror { padding: 8px 12px; outline: none; font: 15px/1.6 -apple-system, system-ui, sans-serif; }
    /* List items follow the page (the app's direction): WebKit draws a marker over a plaintext item's first letter. */
    .ProseMirror p, .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 { unicode-bidi: plaintext; text-align: start; }
    .ProseMirror > * { margin: 0; } .ProseMirror > * + * { margin-top: 12px; }
    .ProseMirror h1 { font-size: 1.5em; } .ProseMirror h2 { font-size: 1.25em; } .ProseMirror h3 { font-size: 1.125em; }
    .ProseMirror ul, .ProseMirror ol { padding-inline-start: 20px; } .ProseMirror li p { unicode-bidi: normal; } .ProseMirror li > p { margin: 0; }
    .ProseMirror blockquote { margin: 0; border: 0; border-inline-start: 2px solid ${separator}; padding-inline-start: 12px; color: ${muted}; }
    .ProseMirror code { background: ${code}; border-radius: 4px; padding: 0 4px; font: 0.9em ui-monospace, Menlo, monospace; }
    .ProseMirror a { color: ${link}; text-underline-offset: 2px; }
    .ProseMirror p.is-editor-empty:first-child::before { color: ${placeholder}; float: inline-start; }
  `;
};

/** A rich-text document field. */
export function RichTextEditor({
  format = "json",
  placeholder,
  characterLimit,
  hasCharacterCount = false,
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
  className,
  accessibilityLabel,
}: RichTextEditorProps): ReactElement {
  const t = useUiText();
  const direction = useDirection();
  const colors = useThemeColor([
    "field",
    "field-foreground",
    "muted",
    "field-placeholder",
    "separator",
    "default",
    "link",
  ] as const);
  const [initial] = useState(() => richTextNativeOf(value ?? defaultValue));
  const isLossy = richTextNativeOf(value).isLossy || (value === undefined && initial.isLossy);
  const isEditable = !isDisabled && !isReadOnly && !isLossy;
  // Counted from the value at once; the editor's own count replaces it when it reports (an HTML value counts its text).
  const [characters, setCharacters] = useState(() =>
    typeof initial.content === "string"
      ? richTextPlainOf(initial.content).replaceAll("\n", "").length
      : richTextLengthOf(initial.content),
  );
  const [linkDraft, setLinkDraft] = useState<string | null>(null);
  // The last document the editor held that this component accepted (native form), and the key of the value it last
  // reported or applied; `isApplying` marks the update a setContent of ours causes, which is not the author's.
  const accepted = useRef<RichTextNode | string>(initial.content);
  const lastKey = useRef(keyOf(value ?? defaultValue));
  const firstKey = useRef(lastKey.current);
  const shownLoad = useRef(0);
  const isApplying = useRef(false);
  const name = accessibilityLabel ?? (typeof label === "string" ? label : undefined);

  const bridgeExtensions = useMemo(
    () => [
      ...TenTapStartKit,
      PlaceholderBridge.configureExtension({ placeholder: placeholder ?? "" }),
      CoreBridge.configureCSS(cssOf(direction, colors)),
    ],
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- created once with the editor; the effects below apply later changes
    [],
  );

  const editor = useEditorBridge({
    bridgeExtensions,
    initialContent: initial.content as string | object,
    editable: isEditable,
    // shortcut: a fixed-height document that scrolls inside; tentap 1.0.1's dynamicHeight measures `.ProseMirror` before
    // TipTap 3 mounts it and the page crashes. Grow-with-content waits for a tentap fix or our own web bundle.
    theme: { webview: { backgroundColor: colors[0] }, webviewContainer: { minHeight: 200 } },
    onChange: () => void read(),
  });
  const state = useBridgeState(editor);
  // Each page load of the WebView (iOS loads it twice) says "editor-ready"; the effects below re-run on each, so CSS,
  // the count and a controlled value reach the page that is showing. tentap's own `isReady` comes only with a later
  // state update.
  const [loads, setLoads] = useState(0);
  const isReady = loads > 0;

  /** Reads the document after a change: counts it, refuses it past the limit, and reports it. */
  async function read() {
    const json = (await editor.getJSON()) as RichTextNode;
    const count = richTextLengthOf(json);
    if (isApplying.current) {
      isApplying.current = false;
      setCharacters(count);
      return;
    }
    if (characterLimit !== undefined && count > characterLimit) {
      isApplying.current = true;
      editor.setContent(accepted.current as string | object);
      return;
    }
    accepted.current = json;
    setCharacters(count);
    const reported = format === "html" ? await editor.getHTML() : richTextReportedOf(json);
    lastKey.current = keyOf(reported);
    onChange?.(reported);
  }

  // Count the first document once the editor is up.
  useEffect(() => {
    if (isReady)
      void editor.getJSON().then((json) => setCharacters(richTextLengthOf(json as RichTextNode)));
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- tentap returns a new bridge object every render
  }, [loads]);

  // A controlled value that differs from the document replaces it, without reporting a change back.
  useEffect(() => {
    if (value === undefined || !isReady) return;
    // A new page starts from the first value again, so it needs the current one unless that is the first.
    const isNewPage = shownLoad.current !== loads;
    shownLoad.current = loads;
    if (isNewPage ? keyOf(value) === firstKey.current : keyOf(value) === lastKey.current) return;
    lastKey.current = keyOf(value);
    const next = richTextNativeOf(value).content;
    accepted.current = next;
    isApplying.current = true;
    editor.setContent(next as string | object);
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- tentap returns a new bridge object every render
  }, [loads, value]);

  const css = cssOf(direction, colors);
  useEffect(() => {
    if (!isReady) return;
    editor.injectCSS(css, CoreBridge.name);
    // The editable element names itself for VoiceOver and TalkBack, as the web editor's textbox does.
    editor.injectJS(
      `document.querySelector('.ProseMirror')?.setAttribute('aria-label', ${JSON.stringify(name ?? "")}); true;`,
    );
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- tentap returns a new bridge object every render
  }, [css, name, loads]);

  useEffect(() => {
    if (isReady) editor.setPlaceholder(placeholder ?? "");
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- tentap returns a new bridge object every render
  }, [placeholder, loads]);

  const groups = [
    [
      {
        id: "bold",
        icon: I.bold,
        label: t(K.bold),
        on: state.isBoldActive,
        press: editor.toggleBold,
      },
      {
        id: "italic",
        icon: I.italic,
        label: t(K.italic),
        on: state.isItalicActive,
        press: editor.toggleItalic,
      },
      {
        id: "underline",
        icon: I.underline,
        label: t(K.underline),
        on: state.isUnderlineActive,
        press: editor.toggleUnderline,
      },
      {
        id: "strike",
        icon: I.strike,
        label: t(K.strike),
        on: state.isStrikeActive,
        press: editor.toggleStrike,
      },
      {
        id: "code",
        icon: I.code,
        label: t(K.code),
        on: state.isCodeActive,
        press: editor.toggleCode,
      },
    ],
    ([1, 2, 3] as const).map((level) => ({
      id: `heading-${level}`,
      icon: `heading-${level}` as const,
      label: t(K.heading, { level }),
      on: state.headingLevel === level,
      press: () => editor.toggleHeading(level),
    })),
    [
      {
        id: "bullet",
        icon: I.bullet,
        label: t(K.bullet_list),
        on: state.isBulletListActive,
        press: editor.toggleBulletList,
      },
      {
        id: "ordered",
        icon: I.ordered,
        label: t(K.ordered_list),
        on: state.isOrderedListActive,
        press: editor.toggleOrderedList,
      },
      {
        id: "quote",
        icon: I.quote,
        label: t(K.blockquote),
        on: state.isBlockquoteActive,
        press: editor.toggleBlockquote,
      },
      {
        id: "link",
        icon: I.link,
        label: t(K.link),
        on: state.isLinkActive,
        press: () => setLinkDraft(state.activeLink ?? ""),
      },
    ],
    [
      {
        id: "undo",
        icon: I.undo,
        label: t(K.undo),
        isDisabled: !state.canUndo,
        press: editor.undo,
      },
      {
        id: "redo",
        icon: I.redo,
        label: t(K.redo),
        isDisabled: !state.canRedo,
        press: editor.redo,
      },
    ],
  ] as const;

  const applyLink = () => {
    const href = linkDraft?.trim() ?? "";
    // Links never run script, as on web.
    editor.setLink(href === "" || /^\s*javascript:/i.test(href) ? null : href);
    setLinkDraft(null);
  };

  return (
    <View className={cn("w-full gap-1", isDisabled && "opacity-50", className) ?? ""}>
      {label == null ? null : (
        <Label
          isRequired={isRequired ?? false}
          isInvalid={isInvalid ?? false}
          isDisabled={isDisabled}
        >
          {label}
        </Label>
      )}
      <View
        className={
          cn(
            "overflow-hidden rounded-[var(--radius-control)] border bg-field",
            isInvalid ? "border-danger" : "border-field-border",
          ) ?? ""
        }
      >
        {isEditable ? (
          // Rows that wrap, so every button shows on a phone without a hidden sideways scroll; they mirror with the
          // app's layout direction.
          <View
            accessibilityRole="toolbar"
            accessibilityLabel={t(K.toolbar)}
            className="flex-row flex-wrap items-center gap-0.5 border-b border-separator p-1"
          >
            {groups.map((group, groupIndex) => (
              <Fragment key={group[0].id}>
                {groupIndex > 0 ? (
                  <Separator orientation="vertical" className="mx-1" style={{ height: 20 }} />
                ) : null}
                {group.map((item) =>
                  "on" in item ? (
                    <ToggleButton
                      key={item.id}
                      label={item.label}
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      isSelected={item.on ?? false}
                      onChange={() => item.press()}
                    >
                      <Icon name={item.icon} size="sm" />
                    </ToggleButton>
                  ) : (
                    <IconButton
                      key={item.id}
                      icon={item.icon}
                      label={item.label}
                      variant="ghost"
                      size="sm"
                      isDisabled={item.isDisabled}
                      onPress={() => item.press()}
                    />
                  ),
                )}
              </Fragment>
            ))}
          </View>
        ) : null}
        {linkDraft === null ? null : (
          <View className="flex-row flex-wrap items-end gap-2 border-b border-separator p-2">
            <View className="min-w-0 flex-1">
              <TextField
                accessibilityLabel={t(K.link_address)}
                value={linkDraft}
                onChange={setLinkDraft}
                placeholder="https://"
                keyboardType="url"
                autoCapitalize="none"
                // oxlint-disable-next-line jsx-a11y/no-autofocus -- the link form opens on a press of its button
                autoFocus
                onSubmitEditing={applyLink}
              />
            </View>
            <Button size="sm" onPress={applyLink}>
              {t(K.link_apply)}
            </Button>
            {state.isLinkActive ? (
              <Button
                size="sm"
                variant="ghost"
                onPress={() => {
                  editor.setLink(null);
                  setLinkDraft(null);
                }}
              >
                {t(K.link_remove)}
              </Button>
            ) : null}
          </View>
        )}
        <RichText
          editor={editor}
          exclusivelyUseCustomOnMessage={false}
          onMessage={(event) => {
            const { data } = event.nativeEvent;
            if (typeof data === "string" && data.includes('"editor-ready"'))
              setLoads((count) => count + 1);
          }}
          accessibilityLabel={name}
          {...(isLossy ? { accessibilityHint: t(K.unsupported) } : {})}
        />
      </View>
      {isLossy ? (
        <Text tone="muted" type="caption">
          {t(K.unsupported)}
        </Text>
      ) : null}
      {hasCharacterCount || characterLimit !== undefined ? (
        // items-end is the reading end, so the count sits at the end edge in either direction.
        <View className="items-end">
          <Text tone="muted" type="caption">
            {characterLimit === undefined
              ? t(K.count, { count: characters })
              : t(K.count_limit, { count: characters, limit: characterLimit })}
          </Text>
        </View>
      ) : null}
      {description == null || isInvalid ? null : <Description>{description}</Description>}
      {isInvalid && errorMessage ? <FieldError isInvalid>{errorMessage}</FieldError> : null}
    </View>
  );
}
