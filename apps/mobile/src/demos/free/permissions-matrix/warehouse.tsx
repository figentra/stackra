/**
 * Stackra file contract:
 * Purpose: the "warehouse" demo of the native PermissionsMatrix: a warehouse's picker, receiver and stock controller roles against
 *          receiving, picking and inventory permissions.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); ADR 0060.
 */
import { PermissionsMatrix, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { PERMISSIONS_MATRIX_DEMO_KEYS } from "#src/demos/free/permissions-matrix/permissions-matrix-demo-keys.constant";

/** The demo's keys. */
const K = PERMISSIONS_MATRIX_DEMO_KEYS.demo_free.permissions_matrix;

/** The warehouse's roles, as ids and their words' keys. */
const ROLES = [
  ["picker", K.role.picker],
  ["receiver", K.role.receiver],
  ["stock_controller", K.role.stock_controller],
] as const;

/** The warehouse's permissions in groups. */
const GROUPS = [
  {
    id: "receiving",
    label: K.group.receiving,
    permissions: [
      { id: "check_in", label: K.permission_name.check_in },
      { id: "put_away", label: K.permission_name.put_away },
    ],
  },
  {
    id: "picking",
    label: K.group.picking,
    permissions: [
      { id: "pick", label: K.permission_name.pick },
      { id: "pack", label: K.permission_name.pack },
    ],
  },
  {
    id: "inventory",
    label: K.group.inventory,
    permissions: [
      { id: "adjust", label: K.permission_name.adjust, description: K.description.adjust },
      { id: "transfer", label: K.permission_name.transfer },
    ],
  },
] as const;

/** The warehouse's grants. */
const GRANTS = {
  picker: ["pick", "pack"],
  receiver: ["check_in", "put_away"],
  stock_controller: ["check_in", "put_away", "pick", "pack", "adjust", "transfer"],
};

/** PermissionsMatrix: Warehouse. */
export default function Warehouse() {
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
    <PermissionsMatrix label={t(K.warehouse_roles)} roles={roles} groups={groups} value={GRANTS} />
  );
}
