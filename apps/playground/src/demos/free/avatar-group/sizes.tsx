/**
 * Stackra file contract:
 * Purpose: the "sizes" demo of the web AvatarGroup: each size, and square avatars for branches.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); design-system gap inventory row 25.
 */
import { AvatarGroup, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { AVATAR_GROUP_KEYS } from "#src/demos/free/avatar-group/avatar-group-keys.constant";

/** The demo's keys. */
const K = AVATAR_GROUP_KEYS.avatar_group;

/** Staff of a Riyadh branch (names are data, never translated). */
const STAFF = [
  { id: "1", name: "ليلى أحمد" },
  { id: "2", name: "Omar Khaled" },
  { id: "3", name: "Sara Nasser" },
  { id: "4", name: "يوسف العتيبي" },
  { id: "5", name: "Mona Saleh" },
  { id: "6", name: "Ada Lovelace" },
  { id: "7", name: "خالد الحربي" },
];

/** Branches of one merchant (names are data). */
const BRANCHES = [
  { id: "ruh", name: "Riyadh Olaya" },
  { id: "jed", name: "جدة التحلية" },
  { id: "dmm", name: "Dammam Corniche" },
];

/** AvatarGroup: Sizes. */
export default function Sizes() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-4">
      {(["sm", "md", "lg"] as const).map((size) => (
        <div key={size} className="flex items-center gap-3">
          <AvatarGroup items={STAFF} size={size} label={t(K.assignees)} />
          <span className="text-xs text-muted">{t(K.size, { size })}</span>
        </div>
      ))}
      <AvatarGroup
        items={BRANCHES}
        shape="square"
        tone="accent"
        variant="soft"
        label={t(K.branches)}
      />
    </div>
  );
}
