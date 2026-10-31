/**
 * Stackra file contract:
 * Purpose: the native `TamoMenu`: a `TamoButton` that opens Tamo's text actions in the house `Menu`: Improve (rewrite,
 *          shorten, expand, fix grammar), Translate (to Arabic, or to English when the text has Arabic letters), Tone
 *          and More (continue writing, the slot's contributed actions); on an empty text only "Draft with Tamo".
 * Boundary: reports the action chosen through `onAction`; it runs nothing. The sections are the web menu's.
 * Runtime: react-native
 * Governing contract: ADR 0507 (the Tamo action menu); ADR 0466 (decision 4).
 */
import type { ReactElement } from "react";

import { TamoActionKind } from "#contracts/enums/tamo-action-kind.enum";
import type { MenuSection } from "#contracts/types/menu-section.type";
import { TAMO_KEYS } from "#core/constants/tamo-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { Menu } from "#native/menu/menu";
import { TamoButton } from "#native/tamo-button/tamo-button";
import type { TamoMenuProps } from "#native/tamo-menu/tamo-menu.props";

/** K: the Tamo words. */
const K = TAMO_KEYS.ui.tamo;
/** Arabic letters: their presence turns Translate towards English. */
const ARABIC = /[\u0600-\u06FF]/u;
/** No contributed actions. */
const NONE: readonly never[] = [];
/** The kinds in each section. */
const IMPROVE = new Set<string>(["rewrite", "shorten", "expand", "fix_grammar"]);
const TONE = new Set<string>(["formal", "friendly"]);

/** Tamo's action menu on a text. */
export function TamoMenu({
  onAction,
  kinds = TamoActionKind,
  actions = NONE,
  hasContinue = false,
  text = "",
  label,
  isIconOnly,
  size = "sm",
  status,
  className,
}: TamoMenuProps): ReactElement {
  const t = useUiText();
  const wordOf = (kind: string) =>
    kind === "translate"
      ? t(ARABIC.test(text) ? K.translate_en : K.translate_ar)
      : t(K[kind as Exclude<TamoActionKind, "translate">]);
  const pick = (filter: (kind: string) => boolean) =>
    kinds.filter(filter).map((kind) => ({ id: kind, label: wordOf(kind) }));
  const sections: MenuSection[] =
    text.trim() === ""
      ? [
          {
            id: "draft",
            title: t(K.actions),
            isTitleHidden: true,
            items: [{ id: "draft", label: t(K.draft) }],
          },
        ]
      : [
          { id: "improve", title: t(K.section_improve), items: pick((kind) => IMPROVE.has(kind)) },
          {
            id: "translate",
            title: wordOf("translate"),
            isTitleHidden: true,
            items: pick((kind) => kind === "translate"),
          },
          { id: "tone", title: t(K.section_tone), items: pick((kind) => TONE.has(kind)) },
          {
            id: "more",
            title: t(K.section_more),
            items: [
              ...(hasContinue ? [{ id: "continue", label: t(K.continue) }] : []),
              ...actions.map((action) => ({
                id: action.id,
                label: action.label,
                description: action.description,
              })),
            ],
          },
        ].filter((section) => section.items.length > 0);
  return (
    <Menu sections={sections} onAction={onAction} align="end">
      <TamoButton
        label={label ?? t(K.ask)}
        isIconOnly={isIconOnly}
        size={size}
        status={status}
        {...(className === undefined ? {} : { className })}
      />
    </Menu>
  );
}
