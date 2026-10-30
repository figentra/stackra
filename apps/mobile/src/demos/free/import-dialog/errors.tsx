/**
 * Stackra file contract:
 * Purpose: the "errors" demo of the native ImportDialog: a sign-up sheet with bad rows: the review lists each problem by
 *          row, the error list goes to the share sheet as CSV, and the good rows still import.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (owner request 2026-10-29).
 */
import { Button, ImportDialog, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { IMPORT_DIALOG_DEMO_KEYS } from "#src/demos/free/import-dialog/import-dialog-demo-keys.constant";

/** The demo's keys. */
const K = IMPORT_DIALOG_DEMO_KEYS.demo_free.import_dialog;

/** Waits `ms`, as a server round trip would. */
const later = <T,>(ms: number, value: T) =>
  new Promise<T>((resolve) => {
    setTimeout(() => resolve(value), ms);
  });

/** Import dialog: With errors. */
export default function Errors() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="items-start">
      <ImportDialog
        trigger={<Button variant="secondary">{t(K.errors.open)}</Button>}
        fields={[
          { key: "name", label: t(K.customers.name), isRequired: true, aliases: ["name"] },
          {
            key: "email",
            label: t(K.customers.email),
            isRequired: true,
            aliases: ["email address"],
          },
          { key: "phone", label: t(K.customers.phone), aliases: ["phone number"] },
        ]}
        onRead={() =>
          later(500, {
            columns: ["Name", "Email address", "Phone number"],
            sample: { Name: "Omar Haddad", "Email address": "omar@", "Phone number": "0501234567" },
            rowCount: 64,
          })
        }
        onDryRun={() =>
          later(700, {
            created: 51,
            updated: 6,
            skipped: 3,
            failed: 4,
            issues: [
              { row: 2, field: t(K.customers.email), message: t(K.errors.bad_email) },
              { row: 17, field: t(K.customers.name), message: t(K.errors.no_name) },
              { row: 33, field: t(K.customers.phone), message: t(K.errors.bad_phone) },
              { row: 58, field: t(K.customers.email), message: t(K.errors.bad_email) },
            ],
          })
        }
        onImport={() => later(900, undefined)}
      />
    </View>
  );
}
