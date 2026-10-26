/**
 * Stackra file contract:
 * Purpose: `PlanCatalogueAdmin`, the console page of one plan-catalogue record (tiers, seat kinds, modules, limits and
 *          trials; a price list per regional tier and currency; an offer; a fee schedule; a rate card): the version in
 *          force, read only; the history with the second-approver decisions; and the form that proposes the next
 *          version from the latest approved one.
 * Boundary: web; composes `CatalogueVersions`, `CatalogueRowsEditor` and `CatalogueProposalForm`. Nothing about a
 *           product or a price is in code: the records are seed-pack data edited here (config-model section 2). An app
 *           mounts one per record on its billing console route and wires the handlers to the OS billing actions.
 * Runtime: browser
 * Governing contract: ADR 0391 (decisions 2 to 5); owner OS-82, OS-381; config-model section 2.
 */
import { CatalogueVersionState } from "@stackra/entitlements/contracts";
import { versionInForce } from "@stackra/entitlements";
import { useTranslation } from "@stackra/i18n/react";
import { Card, Text } from "@stackra/ui/react";
import type { ReactElement } from "react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { CatalogueProposalForm } from "#react/plan-catalogue/catalogue-proposal-form";
import { CatalogueRowsEditor } from "#react/plan-catalogue/catalogue-rows-editor";
import { CatalogueVersions } from "#react/plan-catalogue/catalogue-versions";
import type { PlanCatalogueAdminProps } from "#react/plan-catalogue/plan-catalogue-admin.props";

/**
 * One record's admin page.
 *
 * @example
 * <PlanCatalogueAdmin recordKey="price-list:commerce" kind="price-list" versions={history} viewer={me.id}
 *   timeZone={settings.timeZone} onPropose={propose} onApprove={approve} onReject={reject} />
 */
export function PlanCatalogueAdmin({
  recordKey,
  kind,
  versions,
  viewer,
  timeZone,
  at,
  onPropose,
  onApprove,
  onReject,
}: PlanCatalogueAdminProps): ReactElement {
  const { t } = useTranslation();
  const keys = PANEL_KEYS.panel.plan_catalogue;
  // oxlint-disable-next-line react/purity -- reason: the console shows the version in force now; `at` pins the instant in tests
  const inForce = versionInForce(versions, at ?? new Date());
  const latest = versions
    .filter((version) => version.state === CatalogueVersionState.Approved)
    .reduce<(typeof versions)[number] | undefined>(
      (found, version) =>
        found === undefined || version.version > found.version ? version : found,
      undefined,
    );
  return (
    <div data-record={recordKey} className="flex flex-col gap-4">
      <Card>
        <Card.Header>
          <Card.Title level={2}>{t(keys.in_force)}</Card.Title>
          <Card.Description>{recordKey}</Card.Description>
        </Card.Header>
        <Card.Content>
          {inForce === undefined ? (
            <Text tone="muted">{t(keys.none_in_force)}</Text>
          ) : (
            <CatalogueRowsEditor rows={inForce.rows} isReadOnly />
          )}
        </Card.Content>
      </Card>
      <CatalogueVersions
        versions={versions}
        viewer={viewer}
        at={at}
        onApprove={onApprove}
        onReject={onReject}
      />
      <CatalogueProposalForm
        // A new approved version restarts the form from its rows.
        key={latest?.version ?? 0}
        recordKey={recordKey}
        kind={kind}
        current={latest?.rows ?? []}
        timeZone={timeZone}
        onPropose={onPropose}
      />
    </div>
  );
}
