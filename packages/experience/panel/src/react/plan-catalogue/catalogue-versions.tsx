/**
 * Stackra file contract:
 * Purpose: `CatalogueVersions`, the history of one plan-catalogue record in the console: each version newest first
 *          with its state, the date it takes effect, the in-force mark, the discount mark, who proposed and who
 *          decided it, and, on a pending discount, approve and reject (withdraw for its proposer).
 * Boundary: web; shows and reports only. Approve is never offered to the proposer (second approver, OS-381); the
 *           service refuses it anyway. Every word is `panel::plan_catalogue.*`; dates use the active locale.
 * Runtime: browser
 * Governing contract: ADR 0391 (decisions 2 to 5); owner OS-82 (changes at renewal), OS-381 (second approver).
 */
import { versionInForce } from "@stackra/entitlements";
import { useDateTime, useTranslation } from "@stackra/i18n/react";
import { Button, Card, Chip, Text } from "@stackra/ui/react";
import type { ReactElement } from "react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { catalogueDecisionOf } from "#core/functions/catalogue-decision-of.function";
import type { CatalogueVersionsProps } from "#react/plan-catalogue/catalogue-versions.props";

/** The chip tone and word of each state. */
const STATE = Object.freeze({
  pending: { tone: "warning", key: PANEL_KEYS.panel.plan_catalogue.state_pending },
  approved: { tone: "success", key: PANEL_KEYS.panel.plan_catalogue.state_approved },
  rejected: { tone: "danger", key: PANEL_KEYS.panel.plan_catalogue.state_rejected },
} as const);

/**
 * The versions of one record.
 *
 * @example
 * <CatalogueVersions versions={history} viewer={me.id} onApprove={approve} onReject={reject} />
 */
export function CatalogueVersions({
  versions,
  viewer,
  at,
  onApprove,
  onReject,
}: CatalogueVersionsProps): ReactElement {
  const { t } = useTranslation();
  const date = useDateTime();
  const keys = PANEL_KEYS.panel.plan_catalogue;
  // oxlint-disable-next-line react/purity -- reason: the console shows the version in force now; `at` pins the instant in tests
  const inForce = versionInForce(versions, at ?? new Date());
  const newestFirst = [...versions].sort((a, b) => b.version - a.version);
  return (
    <Card>
      <Card.Header>
        <Card.Title level={2}>{t(keys.history)}</Card.Title>
      </Card.Header>
      <Card.Content>
        {inForce === undefined ? <Text tone="muted">{t(keys.none_in_force)}</Text> : null}
        <ol className="flex flex-col divide-y divide-separator">
          {newestFirst.map((version) => {
            const decision = catalogueDecisionOf(version, viewer);
            const state = STATE[version.state];
            return (
              <li
                key={version.version}
                data-version={version.version}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Text className="font-medium">
                      {t(keys.version, { version: version.version })}
                    </Text>
                    <Chip size="sm" variant="soft" tone={state.tone}>
                      {t(state.key)}
                    </Chip>
                    {inForce?.version === version.version ? (
                      <Chip size="sm" variant="soft" tone="accent">
                        {t(keys.in_force)}
                      </Chip>
                    ) : null}
                    {version.discount ? (
                      <Chip size="sm" variant="soft">
                        {t(keys.discount)}
                      </Chip>
                    ) : null}
                  </div>
                  <Text type="small" tone="muted">
                    {`${t(keys.effective_from)} ${date(version.effectiveFrom, { dateStyle: "medium" })}`}
                  </Text>
                  <Text type="small" tone="muted">
                    {t(keys.proposed_by, { name: version.proposedBy })}
                    {version.decidedBy === undefined
                      ? ""
                      : ` · ${t(keys.decided_by, { name: version.decidedBy })}`}
                  </Text>
                  {decision.isOwn && decision.canReject ? (
                    <Text type="small" tone="muted">
                      {t(keys.own_proposal)}
                    </Text>
                  ) : null}
                </div>
                {decision.canReject ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onPress={() => onReject(version)}>
                      {t(decision.isOwn ? keys.withdraw : keys.reject)}
                    </Button>
                    {decision.canApprove ? (
                      <Button size="sm" onPress={() => onApprove(version)}>
                        {t(keys.approve)}
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </Card.Content>
    </Card>
  );
}
