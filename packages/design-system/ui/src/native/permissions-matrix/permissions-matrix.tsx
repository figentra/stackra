/**
 * Stackra file contract:
 * Purpose: the native `PermissionsMatrix`, read-only (editing is a web task): the same role-by-permission grid as the
 *          web one in a horizontal scroll, each role's access summary ("12 of 30") under its name, each group titled,
 *          and each cell an allowed or not-allowed mark that VoiceOver and TalkBack read as "Issue refunds for
 *          Cashier: Allowed".
 * Boundary: no editing, no motion and no haptics; the summary is `grantCoverageOf`'s. Names come from the caller,
 *           the words from `ui::permissions_matrix.*`.
 * Runtime: react-native
 * Governing contract: design-system gap inventory row 40 (owner choice "P1 + P2 core", 2026-10-28); ADR 0165 (HeroUI
 *          Native on native); ADR 0060 (right-to-left: the row follows the layout direction).
 */
import { useThemeColor } from "heroui-native";
import { Check, Minus } from "lucide-react-native";
import { ScrollView, View } from "react-native";
import type { ReactElement } from "react";

import { PERMISSIONS_MATRIX_KEYS } from "#core/constants/permissions-matrix-keys.constant";
import { grantCoverageOf } from "#core/functions/grant-coverage-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { Text } from "#native/text/text";
import type { PermissionsMatrixProps } from "#native/permissions-matrix/permissions-matrix.props";

/** The keys of the words. */
const K = PERMISSIONS_MATRIX_KEYS.ui.permissions_matrix;

/** The width of the permission column and of each role column, in points: wide enough for a POS role name. */
const NAME_WIDTH = "w-44";
const ROLE_WIDTH = "w-24";

/** A read-only role-by-permission grid of grants, with an access summary per role. */
export function PermissionsMatrix({
  label,
  roles,
  groups,
  value,
  ...rest
}: PermissionsMatrixProps): ReactElement {
  const t = useUiText();
  const allowedColor = useThemeColor("success");
  const deniedColor = useThemeColor("muted");
  const grants = value ?? {};
  const allIds = groups.flatMap((group) => group.permissions.map((permission) => permission.id));

  return (
    <ScrollView {...rest} horizontal accessibilityLabel={label}>
      <View>
        <View className="flex-row border-b border-separator py-2">
          <Text type="small" tone="muted" className={NAME_WIDTH}>
            {t(K.permission)}
          </Text>
          {roles.map((role) => {
            const coverage = grantCoverageOf(grants, [role.id], allIds);
            return (
              <View key={role.id} className={`${ROLE_WIDTH} items-center`}>
                <Text type="small" className="font-medium">
                  {role.label}
                </Text>
                <Text type="caption" tone="muted">
                  {t(K.summary, { count: coverage.count, total: coverage.total })}
                </Text>
              </View>
            );
          })}
        </View>
        {groups.map((group) => (
          <View key={group.id}>
            <View accessibilityRole="header" className="bg-surface-secondary py-2">
              <Text type="small" className="font-semibold">
                {group.label}
              </Text>
            </View>
            {group.permissions.map((permission) => (
              <View
                key={permission.id}
                className="flex-row items-center border-b border-separator py-2"
              >
                <View className={NAME_WIDTH}>
                  <Text type="small">{permission.label}</Text>
                  {permission.description ? (
                    <Text type="caption" tone="muted">
                      {permission.description}
                    </Text>
                  ) : null}
                </View>
                {roles.map((role) => {
                  const isGranted = (grants[role.id] ?? []).includes(permission.id);
                  return (
                    <View
                      key={role.id}
                      accessible
                      accessibilityRole="image"
                      accessibilityLabel={t(K.cell_state, {
                        permission: permission.label,
                        role: role.label,
                        state: t(isGranted ? K.allowed : K.denied),
                      })}
                      className={`${ROLE_WIDTH} items-center`}
                    >
                      {isGranted ? (
                        <Check size={16} color={allowedColor} />
                      ) : (
                        <Minus size={16} color={deniedColor} />
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
