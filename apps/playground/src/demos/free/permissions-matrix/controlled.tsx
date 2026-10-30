/**
 * Stackra file contract:
 * Purpose: the "controlled" demo of the web PermissionsMatrix: the grants held by the page, with a count of unsaved changes, Save and
 *          Reset, as a settings form wires it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Button, PermissionsMatrix, Text, useCatalogueText } from "@stackra/ui/react";
import type { PermissionGrants } from "@stackra/ui/contracts";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { PERMISSIONS_MATRIX_KEYS } from "#src/demos/free/permissions-matrix/permissions-matrix-keys.constant";

/** The demo's keys. */
const K = PERMISSIONS_MATRIX_KEYS.permissions_matrix;

/** The store's roles, as ids and their words' keys. */
const ROLES = [
  ["cashier", K.role.cashier],
  ["supervisor", K.role.supervisor],
  ["manager", K.role.manager],
  ["owner", K.role.owner],
] as const;

/** The store's permissions in groups: each id with its words' keys. */
const GROUPS = [
  {
    id: "sales",
    label: K.group.sales,
    permissions: [
      { id: "sell", label: K.permission_name.sell },
      { id: "discount", label: K.permission_name.discount, description: K.description.discount },
      { id: "refund", label: K.permission_name.refund, description: K.description.refund },
      { id: "void", label: K.permission_name.void, description: K.description.void },
    ],
  },
  {
    id: "cash",
    label: K.group.cash,
    permissions: [
      { id: "open_drawer", label: K.permission_name.open_drawer },
      { id: "count_cash", label: K.permission_name.count_cash },
      { id: "close_shift", label: K.permission_name.close_shift },
    ],
  },
  {
    id: "inventory",
    label: K.group.inventory,
    permissions: [
      { id: "receive", label: K.permission_name.receive },
      { id: "adjust", label: K.permission_name.adjust, description: K.description.adjust },
      { id: "transfer", label: K.permission_name.transfer },
    ],
  },
] as const;

/** A store's grants as its settings hold them. */
const GRANTS = {
  cashier: ["sell", "open_drawer"],
  supervisor: ["sell", "discount", "refund", "open_drawer", "count_cash", "close_shift"],
  manager: [
    "sell",
    "discount",
    "refund",
    "void",
    "open_drawer",
    "count_cash",
    "close_shift",
    "receive",
    "adjust",
  ],
  owner: [
    "sell",
    "discount",
    "refund",
    "void",
    "open_drawer",
    "count_cash",
    "close_shift",
    "receive",
    "adjust",
    "transfer",
  ],
};

/** The PermissionsMatrix demo: controlled. */
export default function Controlled() {
  const t = useCatalogueText(MESSAGES.en);
  const roles = ROLES.map(([id, label]) => ({ id, label: t(label) }));
  const groups = GROUPS.map((group) => ({
    id: group.id,
    label: t(group.label),
    permissions: group.permissions.map((permission) => ({
      id: permission.id,
      label: t(permission.label),
      ...("description" in permission ? { description: t(permission.description) } : {}),
    })),
  }));
  const [saved, setSaved] = useState<PermissionGrants>(GRANTS);
  const [draft, setDraft] = useState<PermissionGrants>(GRANTS);
  const changes = ROLES.reduce((sum, [id]) => {
    const before = saved[id] ?? [];
    const after = draft[id] ?? [];
    return (
      sum +
      after.filter((p) => !before.includes(p)).length +
      before.filter((p) => !after.includes(p)).length
    );
  }, 0);
  return (
    <div className="grid gap-3">
      <PermissionsMatrix
        label={t(K.store_roles)}
        roles={roles}
        groups={groups}
        value={draft}
        onChange={setDraft}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Text role="status" tone="muted">
          {changes === 0 ? t(K.saved) : t(K.changes, { count: changes })}
        </Text>
        <Button isDisabled={changes === 0} onPress={() => setSaved(draft)}>
          {t(K.save)}
        </Button>
        <Button variant="secondary" isDisabled={changes === 0} onPress={() => setDraft(saved)}>
          {t(K.reset)}
        </Button>
      </div>
    </div>
  );
}
