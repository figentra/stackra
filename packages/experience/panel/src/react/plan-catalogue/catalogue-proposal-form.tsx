/**
 * Stackra file contract:
 * Purpose: `CatalogueProposalForm`, the plan-catalogue admin's form to propose the next version of one record: the
 *          rows (the rows editor, starting from the current version), the day it takes effect (tomorrow at the
 *          earliest, so a change is never backdated), and whether it is a discount; it shows the kind reader's
 *          complaint and proposes only rows that read.
 * Boundary: web; proposes only. A change that lowers a price or adds an offer is a discount by
 *           `isCatalogueDiscount`, and the admin cannot unmark it; any other change may be marked a discount by hand.
 *           A discount waits for a second approver. Subscribers get the change at their next term (OS-82), which the
 *           form says.
 * Runtime: browser
 * Governing contract: ADR 0391 (decisions 2 to 5); owner OS-82 (changes at renewal), OS-381 (second approver).
 */
import { today } from "@internationalized/date";
import { useTranslation } from "@stackra/i18n/react";
import type { CatalogueRow } from "@stackra/contracts";
import { isCatalogueDiscount } from "@stackra/pricing";
import { Alert, Button, Card, DatePicker, Switch, Text } from "@stackra/ui/react";
import { useState, type ReactElement } from "react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { catalogueRowsError } from "#core/functions/catalogue-rows-error.function";
import { CatalogueRowsEditor } from "#react/plan-catalogue/catalogue-rows-editor";
import type { CatalogueProposalFormProps } from "#react/plan-catalogue/catalogue-proposal-form.props";

/** Whether the change is a discount; a current version its reader refuses is compared as no rows. */
function isDiscount(
  kind: string,
  current: readonly CatalogueRow[],
  next: readonly CatalogueRow[],
): boolean {
  try {
    return isCatalogueDiscount(kind, current, next);
  } catch {
    return isCatalogueDiscount(kind, [], next);
  }
}

/**
 * The form to propose a change.
 *
 * @example
 * <CatalogueProposalForm recordKey="price-list:commerce" kind="price-list" current={rows} timeZone="Asia/Riyadh" onPropose={propose} />
 */
export function CatalogueProposalForm({
  recordKey,
  kind,
  current,
  timeZone,
  onPropose,
}: CatalogueProposalFormProps): ReactElement {
  const { t } = useTranslation();
  const keys = PANEL_KEYS.panel.plan_catalogue;
  const earliest = today(timeZone).add({ days: 1 });
  const [rows, setRows] = useState<readonly CatalogueRow[]>(current);
  const [day, setDay] = useState(earliest);
  const [isMarked, setIsMarked] = useState(false);
  const problem = catalogueRowsError(kind, recordKey, rows);
  // Only rows that read can be compared; until then nothing is detected and the proposal is refused anyway.
  const isDetected = problem === undefined && isDiscount(kind, current, rows);
  const discount = isDetected || isMarked;

  return (
    <Card>
      <Card.Header>
        <Card.Title level={2}>{t(keys.propose)}</Card.Title>
        <Card.Description>{t(keys.renewal)}</Card.Description>
      </Card.Header>
      <Card.Content>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (problem !== undefined) return;
            onPropose({
              key: recordKey,
              kind,
              rows,
              effectiveFrom: day.toDate(timeZone),
              discount,
            });
          }}
        >
          <CatalogueRowsEditor rows={rows} onChange={setRows} />
          <DatePicker
            label={t(keys.effective_from)}
            value={day}
            minValue={earliest}
            onChange={(next) => setDay(next ?? earliest)}
            isRequired
          />
          <Switch
            label={t(keys.mark_discount)}
            value={discount}
            onChange={setIsMarked}
            isDisabled={isDetected}
          />
          {isDetected ? <Text tone="muted">{t(keys.discount_detected)}</Text> : null}
          {problem === undefined ? null : (
            <Alert tone="danger" title={t(keys.invalid, { reason: problem })} />
          )}
          <div>
            <Button type="submit" isDisabled={problem !== undefined}>
              {t(keys.submit)}
            </Button>
          </div>
        </form>
      </Card.Content>
    </Card>
  );
}
