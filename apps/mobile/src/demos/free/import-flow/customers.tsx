/**
 * Stackra file contract:
 * Purpose: the "customers" demo of the native ImportFlow: import customers.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (wave 3b).
 */
import type { ImportDryRun } from "@stackra/ui/contracts";
import { ImportFlow, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { IMPORT_FLOW_DEMO_KEYS } from "#src/demos/free/import-flow/import-flow-demo-keys.constant";

/** The demo's keys. */
const K = IMPORT_FLOW_DEMO_KEYS.demo_free.import_flow.customers;

const COLUMNS = ["Full Name", "E-mail", "Mobile", "Notes"];
const SAMPLE = {
  "Full Name": "Sara Ali",
  "E-mail": "sara@example.com",
  Mobile: "+966 50 123 4567",
  Notes: "VIP",
};

/** Match the columns, check the file, import. */
export default function Customers() {
  const t = useCatalogueText(MESSAGES.en);
  const [dryRun, setDryRun] = useState<ImportDryRun | undefined>(undefined);
  const [done, setDone] = useState(0);
  if (done > 0)
    return (
      <Text type="small" tone="success">
        {t(K.done, { count: done })}
      </Text>
    );
  return (
    <ImportFlow
      columns={COLUMNS}
      sample={SAMPLE}
      fields={[
        { key: "name", label: t(K.name), isRequired: true },
        { key: "email", label: t(K.email), isRequired: true, aliases: ["e-mail"] },
        { key: "phone", label: t(K.phone), aliases: ["mobile"] },
        { key: "city", label: t(K.city) },
      ]}
      dryRun={dryRun}
      onDryRun={() =>
        setDryRun({
          created: 182,
          updated: 24,
          failed: 2,
          issues: [{ row: 14, field: t(K.email), message: t(K.bad_email) }],
        })
      }
      onBack={() => setDryRun(undefined)}
      onImport={() => setDone(206)}
    />
  );
}
