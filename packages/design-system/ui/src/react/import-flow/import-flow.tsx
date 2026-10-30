/**
 * Stackra file contract:
 * Purpose: the web `ImportFlow`: step one matches each file column (with its first value as a hint) to a field or
 *          skips it, starting from the automatic match, and blocks the check until every required field is matched;
 *          step two shows the dry run (to create, to update, refused) and its problems by row, then imports or goes back.
 * Boundary: no parsing, no saving: the app reads the file and runs the dry run and the import. The two steps are
 *           `ImportMappingList` and `ImportReview`, which the ImportDialog draws too.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.3.1, 3.3.1 and 4.1.3; STA-1371.
 */
import { cn } from "@heroui/react";
import { type ReactElement, useState } from "react";

import type { ImportMapping } from "#contracts/types/import-mapping.type";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { importMappingOf } from "#core/functions/import-mapping-of.function";
import { unmappedRequiredOf } from "#core/functions/unmapped-required-of.function";
import { Button } from "#react/button/button";
import { useUiText } from "#react/hooks/use-ui-text";
import type { ImportFlowProps } from "#react/import-flow/import-flow.props";
import { ImportMappingList } from "#react/import-flow/import-mapping-list";
import { ImportReview } from "#react/import-flow/import-review";

/** The words' keys. */
const K = UI_KEYS.ui.import_flow;

/** Map columns, then review a dry run. */
export function ImportFlow({
  columns,
  sample,
  fields,
  mapping,
  onMappingChange,
  onDryRun,
  dryRun,
  onImport,
  onBack,
  isBusy = false,
  className,
}: ImportFlowProps): ReactElement {
  const t = useUiText();
  const [own, setOwn] = useState<ImportMapping>(() => importMappingOf(columns, fields));
  const current = mapping ?? own;
  const setMapping = (next: ImportMapping) => {
    setOwn(next);
    onMappingChange?.(next);
  };
  if (dryRun)
    return (
      <div data-slot="import-flow" className={cn("flex flex-col gap-4", className)}>
        <ImportReview result={dryRun} />
        <div className="flex justify-end gap-2">
          {onBack ? (
            <Button variant="secondary" onPress={onBack} isDisabled={isBusy}>
              {t(K.back)}
            </Button>
          ) : null}
          <Button
            onPress={() => onImport(current)}
            isLoading={isBusy}
            isDisabled={dryRun.created + dryRun.updated === 0}
          >
            {t(K.import)}
          </Button>
        </div>
      </div>
    );
  return (
    <div data-slot="import-flow" className={cn("flex flex-col gap-4", className)}>
      <h3 className="m-0 text-sm font-semibold">{t(K.mapping)}</h3>
      <ImportMappingList
        columns={columns}
        sample={sample}
        fields={fields}
        mapping={current}
        onChange={setMapping}
      />
      <div className="flex justify-end">
        <Button
          onPress={() => onDryRun(current)}
          isLoading={isBusy}
          isDisabled={unmappedRequiredOf(fields, current).length > 0}
        >
          {t(K.check)}
        </Button>
      </div>
    </div>
  );
}
