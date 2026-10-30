/**
 * Stackra file contract:
 * Purpose: the "customers" demo of the web ImportFlow: import customers.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import type { ImportDryRun } from "@stackra/ui/contracts";
import { ImportFlow, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { IMPORT_FLOW_KEYS } from "#src/demos/free/import-flow/import-flow-keys.constant";

/** The demo's keys. */
const K = IMPORT_FLOW_KEYS.import_flow;

/** The file's header and first row. */
const COLUMNS = ["Full Name", "E-mail", "Mobile", "Notes"];
const SAMPLE = {
  "Full Name": "Sara Ali",
  "E-mail": "sara@example.com",
  Mobile: "+966 50 123 4567",
  Notes: "VIP",
};

/** Import flow: match the columns, check the file, import. */
export default function Customers() {
  const t = useCatalogueText(MESSAGES.en);
  const [dryRun, setDryRun] = useState<ImportDryRun | undefined>(undefined);
  const [done, setDone] = useState(0);
  if (done > 0) return <p className="m-0 text-sm text-success">{t(K.done, { count: done })}</p>;
  return (
    <ImportFlow
      className="w-full max-w-xl"
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
          issues: [
            { row: 14, field: t(K.email), message: t(K.bad_email) },
            { row: 87, field: t(K.email), message: t(K.bad_email) },
          ],
        })
      }
      onBack={() => setDryRun(undefined)}
      onImport={() => setDone(206)}
    />
  );
}
