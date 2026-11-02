/**
 * Stackra file contract:
 * Purpose: `RolesPage`, the IAM kit's roles and permissions page: a page header, then the built-in roles' grants as a
 *          read-only `PermissionsMatrix` and the custom roles' grants as a second one, editable when `isEditable`. The
 *          header's save action hands the custom roles' grants to `onSave`.
 * Boundary: composition of @stackra/ui's `PageHeader`, `Heading`, `PermissionsMatrix` and `Text`; it holds the edits
 *           until they are saved and nothing else. The roles, groups and stored grants are the host's props; a
 *           successful save drops the edits so the host's new `grants` show, and a failed one keeps them and shows
 *           the host's `failed` words. A matrix with no roles is left out.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0208 (roles and permission names); ADR 0165 (UI through
 *                     @stackra/ui); ADR 0060 (right-to-left: logical sides only).
 */
import { Heading, PageHeader, PermissionsMatrix, Text } from "@stackra/ui/react";
import type { PermissionGrants, PermissionRole } from "@stackra/ui/contracts";
import { type ReactElement, useState } from "react";

import type { RolesPageProps } from "#react/roles-page/roles-page.props";

/**
 * The roles and permissions page.
 *
 * @example
 * <RolesPage roles={roles} groups={groups} grants={grants} isEditable onSave={saveGrants} labels={labels} />
 */
export function RolesPage({
  roles,
  groups,
  grants,
  permissionGroups,
  isEditable = false,
  onSave,
  labels,
  className,
}: RolesPageProps): ReactElement {
  const [draft, setDraft] = useState<PermissionGrants | null>(null);
  const [isSaving, setSaving] = useState(false);
  const [result, setResult] = useState<"saved" | "failed" | null>(null);
  const shown = draft ?? grants;
  const listed = permissionGroups
    ? groups.filter((group) => permissionGroups.includes(group.id))
    : groups;
  const builtIn = roles.filter((role) => !role.isCustom);
  const custom = roles.filter((role) => role.isCustom);
  const canSave = isEditable && onSave !== undefined && custom.length > 0;

  const save = async () => {
    if (draft === null || onSave === undefined) return;
    setSaving(true);
    setResult(null);
    try {
      await onSave(Object.fromEntries(custom.map((role) => [role.id, draft[role.id] ?? []])));
      setDraft(null);
      setResult("saved");
    } catch {
      setResult("failed");
    } finally {
      setSaving(false);
    }
  };

  /** One titled matrix of `columns`. */
  const matrix = (title: string, columns: readonly PermissionRole[], isReadOnly: boolean) =>
    columns.length === 0 ? null : (
      <section className="flex flex-col gap-3">
        <Heading level={2} type="h5">
          {title}
        </Heading>
        <PermissionsMatrix
          label={title}
          roles={columns}
          groups={listed}
          value={shown}
          isReadOnly={isReadOnly}
          onChange={(next) => {
            setDraft(next);
            setResult(null);
          }}
        />
      </section>
    );

  return (
    <div className={`flex flex-col gap-6 ${className ?? ""}`}>
      <PageHeader
        title={labels.title}
        description={labels.description}
        actions={
          canSave
            ? [
                {
                  id: "save",
                  label: isSaving ? labels.saving : labels.save,
                  isDisabled: draft === null || isSaving,
                  onPress: () => void save(),
                },
              ]
            : []
        }
      />
      {matrix(labels.builtIn, builtIn, true)}
      {matrix(labels.custom, custom, !isEditable)}
      <Text role="status" tone="muted" type="small">
        {result === "saved" ? labels.saved : ""}
      </Text>
      {result === "failed" && (
        <Text role="alert" tone="danger" type="small">
          {labels.failed}
        </Text>
      )}
    </div>
  );
}
