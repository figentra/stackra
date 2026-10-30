/**
 * Stackra file contract:
 * Purpose: the "store-roles" demo of the native PermissionsMatrix: a store's four POS roles against its sales, cash drawer and
 *          inventory permissions, read-only on a phone,
 *          with each role's access summary; scroll sideways for every role.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); ADR 0060.
 */
import { PermissionsMatrix, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { PERMISSIONS_MATRIX_DEMO_KEYS } from "#src/demos/free/permissions-matrix/permissions-matrix-demo-keys.constant";

/** The demo's keys. */
const K = PERMISSIONS_MATRIX_DEMO_KEYS.demo_free.permissions_matrix;

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

/** PermissionsMatrix: Store roles. */
export default function StoreRoles() {
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
  return (
    <PermissionsMatrix label={t(K.store_roles)} roles={roles} groups={groups} value={GRANTS} />
  );
}
