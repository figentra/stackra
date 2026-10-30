/**
 * Stackra file contract:
 * Purpose: the native `ImportFlow`: step one matches each file column (with its first value as a hint) to a field or
 *          skips it, from the automatic match, and blocks the check until the required fields are matched; step two
 *          shows the dry run's counts and problems by row, then imports or goes back.
 * Boundary: no parsing, no saving: the app reads the file and runs the dry run and the import. The two steps are
 *           `ImportMappingList` and `ImportReview`, which the native ImportDialog draws too.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */
import { type ReactElement, useState } from "react";
import { View } from "react-native";

import type { ImportMapping } from "#contracts/types/import-mapping.type";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { importMappingOf } from "#core/functions/import-mapping-of.function";
import { unmappedRequiredOf } from "#core/functions/unmapped-required-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { Button } from "#native/button/button";
import type { ImportFlowProps } from "#native/import-flow/import-flow.props";
import { ImportMappingList } from "#native/import-flow/import-mapping-list";
import { ImportReview } from "#native/import-flow/import-review";
import { Text } from "#native/text/text";

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
  const frame = ["gap-4", className].filter(Boolean).join(" ");
  if (dryRun)
    return (
      <View className={frame}>
        <ImportReview result={dryRun} />
        <View className="flex-row justify-end gap-2">
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
        </View>
      </View>
    );
  return (
    <View className={frame}>
      <Text accessibilityRole="header" className="text-sm font-semibold">
        {t(K.mapping)}
      </Text>
      <ImportMappingList
        columns={columns}
        sample={sample}
        fields={fields}
        mapping={current}
        onChange={setMapping}
      />
      <Button
        onPress={() => onDryRun(current)}
        isLoading={isBusy}
        isDisabled={unmappedRequiredOf(fields, current).length > 0}
      >
        {t(K.check)}
      </Button>
    </View>
  );
}
