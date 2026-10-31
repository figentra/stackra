/**
 * Stackra file contract:
 * Purpose: the web `PermissionsMatrix`: a role-by-permission table with a checkbox per cell, a bulk checkbox per role
 *          (its whole column) and per group and role (a group's rows), each dashed when partly granted, and an access
 *          summary ("12 of 30") under each role. A bulk toggle sends a ripple down the cells it changed. Read-only, the
 *          cells are allowed or not-allowed marks with the same names.
 * Boundary: a semantic `<table>` (scoped headers, one `<tbody>` per group) of the house `Checkbox`; the grant rules are
 *           `setPermissionGrants` and `grantCoverageOf`. Controlled through `value`, or uncontrolled from
 *           `defaultValue`. The ripple is Motion's: each changed cell pops in one stagger step after the previous, and
 *           none under reduced motion or with `isAnimated` off.
 * Runtime: browser
 * Governing contract: design-system gap inventory row 40 (owner choice "P1 + P2 core", 2026-10-28); ADR 0329
 *          (motion layer); ADR 0060 (right-to-left: logical alignment only).
 */
import { cn } from "@heroui/react";
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { Check, Minus } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useState, type ReactElement, type ReactNode } from "react";

import type { PermissionGrants } from "#contracts/types/permission-grants.type";
import { PERMISSIONS_MATRIX_KEYS } from "#core/constants/permissions-matrix-keys.constant";
import { grantCoverageOf } from "#core/functions/grant-coverage-of.function";
import { setPermissionGrants } from "#core/functions/set-permission-grants.function";
import { Checkbox } from "#react/checkbox/checkbox";
import { useUiText } from "#react/hooks/use-ui-text";
import type { PermissionsMatrixProps } from "#react/permissions-matrix/permissions-matrix.props";

const FAST = motionTiming(STACKRA_THEME, "fast");
const STAGGER = motionTiming(STACKRA_THEME, "stagger");

/** The longest wait before a cell of a ripple pops, so a long column still settles quickly, in ms. */
const RIPPLE_MAX_DELAY_MS = STAGGER.durationMs * 8;

/** The keys of the words. */
const K = PERMISSIONS_MATRIX_KEYS.ui.permissions_matrix;

/** No grants. */
const NONE: PermissionGrants = Object.freeze({});

/** The cells a bulk toggle changed: they pop in order of `permissionIds`. */
interface Ripple {
  readonly id: number;
  readonly roleIds: readonly string[];
  readonly permissionIds: readonly string[];
}

/** A role-by-permission grid of grants, with bulk toggles and an access summary per role. */
export function PermissionsMatrix({
  label,
  roles,
  groups,
  value,
  defaultValue,
  onChange,
  isReadOnly = false,
  isAnimated = true,
  className,
  ...rest
}: PermissionsMatrixProps): ReactElement {
  const t = useUiText();
  const isReduced = useReducedMotion() ?? false;
  const [own, setOwn] = useState<PermissionGrants>(defaultValue ?? NONE);
  const [ripple, setRipple] = useState<Ripple | undefined>(undefined);
  const grants = value ?? own;
  const allIds = groups.flatMap((group) => group.permissions.map((permission) => permission.id));

  const apply = (
    roleIds: readonly string[],
    permissionIds: readonly string[],
    isGranted: boolean,
    isBulk: boolean,
  ) => {
    const next = setPermissionGrants(grants, roleIds, permissionIds, isGranted);
    if (value === undefined) setOwn(next);
    if (isBulk) setRipple({ id: (ripple?.id ?? 0) + 1, roleIds, permissionIds });
    onChange?.(next);
  };

  /** A cell's control, popping in when the last bulk toggle changed it. */
  const cell = (roleId: string, permissionId: string, control: ReactNode) => {
    const order = ripple?.roleIds.includes(roleId)
      ? ripple.permissionIds.indexOf(permissionId)
      : -1;
    if (order < 0 || !ripple || !isAnimated || isReduced) return control;
    return (
      <motion.span
        key={ripple.id}
        className="inline-flex"
        initial={{ scale: 0.8, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: FAST.durationMs / 1000,
          delay: Math.min(order * STAGGER.durationMs, RIPPLE_MAX_DELAY_MS) / 1000,
        }}
      >
        {control}
      </motion.span>
    );
  };

  return (
    <div
      {...rest}
      className={cn("overflow-x-auto", className) ?? ""}
      data-slot="permissions-matrix"
    >
      <table aria-label={label} className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-separator">
            <th scope="col" className="p-3 text-start font-medium text-muted">
              {t(K.permission)}
            </th>
            {roles.map((role) => {
              const coverage = grantCoverageOf(grants, [role.id], allIds);
              return (
                <th key={role.id} scope="col" className="p-3 text-center align-top font-medium">
                  <div className="flex flex-col items-center gap-1">
                    <span>{role.label}</span>
                    <span className="text-xs font-normal text-muted">
                      {t(K.summary, { count: coverage.count, total: coverage.total })}
                    </span>
                    {isReadOnly ? null : (
                      <Checkbox
                        aria-label={t(K.all_for_role, { role: role.label })}
                        value={coverage.isAll}
                        isIndeterminate={coverage.isSome}
                        onChange={(isGranted) => apply([role.id], allIds, isGranted, true)}
                      />
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        {groups.map((group) => {
          const groupIds = group.permissions.map((permission) => permission.id);
          return (
            <tbody key={group.id}>
              <tr className="border-b border-separator bg-surface-secondary">
                <th scope="rowgroup" className="p-3 text-start font-semibold">
                  {group.label}
                </th>
                {roles.map((role) => {
                  const coverage = grantCoverageOf(grants, [role.id], groupIds);
                  return (
                    <td key={role.id} className="p-3 text-center">
                      {isReadOnly ? null : (
                        <Checkbox
                          aria-label={t(K.group_for_role, { group: group.label, role: role.label })}
                          value={coverage.isAll}
                          isIndeterminate={coverage.isSome}
                          onChange={(isGranted) => apply([role.id], groupIds, isGranted, true)}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
              {group.permissions.map((permission) => (
                <tr key={permission.id} className="border-b border-separator">
                  <th scope="row" className="p-3 text-start font-normal">
                    <span className="block">{permission.label}</span>
                    {permission.description ? (
                      <span className="block text-xs text-muted">{permission.description}</span>
                    ) : null}
                  </th>
                  {roles.map((role) => {
                    const isGranted = (grants[role.id] ?? []).includes(permission.id);
                    const names = { permission: permission.label, role: role.label };
                    return (
                      <td key={role.id} className="p-3 text-center">
                        {isReadOnly ? (
                          <span
                            role="img"
                            aria-label={t(K.cell_state, {
                              ...names,
                              state: t(isGranted ? K.allowed : K.denied),
                            })}
                            className={cn("inline-flex", isGranted ? "text-success" : "text-muted")}
                          >
                            {isGranted ? (
                              <Check size={16} aria-hidden />
                            ) : (
                              <Minus size={16} aria-hidden />
                            )}
                          </span>
                        ) : (
                          cell(
                            role.id,
                            permission.id,
                            <Checkbox
                              aria-label={t(K.cell, names)}
                              value={isGranted}
                              onChange={(next) => apply([role.id], [permission.id], next, false)}
                            />,
                          )
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}
