/**
 * Stackra file contract:
 * Purpose: the "rows" demo of the native List: a leading icon or avatar, trailing content, and a chevron.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { ListItemData } from "@stackra/ui/contracts";
import { Avatar, Chip, List, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { LIST_DEMO_KEYS } from "#src/demos/free/list/list-demo-keys.constant";

/** The demo's keys. */
const K = LIST_DEMO_KEYS.demo_free.list.rows;

/** The chevron says the row opens something. */
export default function Rows() {
  const t = useCatalogueText(MESSAGES.en);
  const team: readonly ListItemData[] = [
    {
      id: "ada",
      title: "Ada Lovelace",
      description: "ada@example.com",
      startIcon: <Avatar name="Ada Lovelace" size="sm" />,
      endContent: <Chip size="sm">{t(K.owner)}</Chip>,
      hasChevron: true,
    },
    {
      id: "grace",
      title: "Grace Hopper",
      description: "grace@example.com",
      startIcon: <Avatar name="Grace Hopper" size="sm" />,
      endContent: <Chip size="sm">{t(K.admin)}</Chip>,
      hasChevron: true,
    },
    {
      id: "alerts",
      title: t(K.notifications),
      startIcon: "bell",
      endContent: t(K.on),
      hasChevron: true,
    },
  ];
  return <List scrollEnabled={false} label={t(K.label)} items={team} />;
}
